const prisma = require('../config/prisma');
const { getNowInTz, toMinutes } = require('../utils/time');
const { getGraceMinutes } = require('./settingsService');
const { promoteNext } = require('./waitlistService');

/**
 * Marks APPROVED bookings that were never checked in as NO_SHOW:
 *  - bookings dated before today (missed by earlier runs / server downtime), and
 *  - today's bookings whose start time + grace period has passed.
 *
 * NOTE: this no longer touches Resource.status. Resource.status is only for
 * AVAILABLE / MAINTENANCE / OUT_OF_SERVICE, so a no-show can never overwrite MAINTENANCE.
 */
async function processNoShowAutoRelease() {
  try {
    const graceMinutes = await getGraceMinutes();
    const now = getNowInTz();

    const candidates = await prisma.booking.findMany({
      where: {
        date: { lte: now.date },
        status: 'APPROVED',
        checkedInAt: null
      },
      include: { resource: true }
    });

    let autoReleasedCount = 0;

    for (const booking of candidates) {
      const isPastDay = booking.date < now.date;
      const graceExpired =
        booking.date === now.date &&
        now.minutes >= toMinutes(booking.startTime) + graceMinutes;

      if (!isPastDay && !graceExpired) continue;

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'NO_SHOW',
          rejectionReason: `Automatically marked NO_SHOW after the ${graceMinutes} minute check-in grace period expired.`
        }
      });

      await prisma.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Auto-Released (No-Show)',
          message: `Your booking for ${booking.resource.name} (${booking.date} ${booking.startTime}) was marked NO_SHOW because check-in was not completed within ${graceMinutes} minutes.`,
          type: 'NO_SHOW'
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: booking.userId,
          action: 'AUTO_RELEASE_NO_SHOW',
          entity: 'BOOKING',
          entityId: booking.id,
          details: `Grace period (${graceMinutes} mins) expired. Booking ${booking.bookingCode} automatically released.`
        }
      });

      autoReleasedCount++;
      console.log(`⏱️ Auto-released no-show booking ${booking.bookingCode} for resource ${booking.resource.name}`);

      // Trigger waitlist promotion for the freed slot
      promoteNext(booking.resourceId, booking.date, booking.startTime, booking.endTime);
    }
    

    return { autoReleasedCount };
  } catch (error) {
    console.error('❌ Error processing no-show auto release:', error.message);
    return { error: error.message };
  }
}

module.exports = { processNoShowAutoRelease };
