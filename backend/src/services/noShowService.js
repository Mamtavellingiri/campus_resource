const prisma = require('../config/prisma');

/**
 * Scans active APPROVED bookings for overdue check-ins.
 * If time has exceeded (startTime + gracePeriodMinutes) and user hasn't checked in,
 * mark booking status as NO_SHOW and release the resource.
 */
async function processNoShowAutoRelease() {
  try {
    // Get grace period setting (default 15 minutes)
    const graceSetting = await prisma.systemSetting.findUnique({
      where: { key: 'grace_period_minutes' }
    });
    const graceMinutes = graceSetting ? parseInt(graceSetting.value, 10) : 15;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Fetch APPROVED bookings for today that haven't been checked in
    const activeBookings = await prisma.booking.findMany({
      where: {
        date: todayStr,
        status: 'APPROVED',
        checkedInAt: null
      },
      include: {
        resource: true,
        user: true
      }
    });

    let autoReleasedCount = 0;

    for (const booking of activeBookings) {
      const [startH, startM] = booking.startTime.split(':').map(Number);
      const bookingStartMinutes = startH * 60 + startM;
      const deadlineMinutes = bookingStartMinutes + graceMinutes;

      if (currentMinutes >= deadlineMinutes) {
        // Mark as NO_SHOW
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'NO_SHOW',
            rejectionReason: `Automatically marked NO_SHOW and released resource after ${graceMinutes} minute check-in grace period expired.`
          }
        });

        // Ensure resource status is AVAILABLE
        await prisma.resource.update({
          where: { id: booking.resourceId },
          data: { status: 'AVAILABLE' }
        });

        // Notify user
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            title: 'Booking Auto-Released (No-Show)',
            message: `Your booking for ${booking.resource.name} (${booking.date} ${booking.startTime}) was marked NO_SHOW because check-in was not completed within ${graceMinutes} minutes.`,
            type: 'NO_SHOW'
          }
        });

        // Log audit event
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
      }
    }

    return { autoReleasedCount };
  } catch (error) {
    console.error('❌ Error processing no-show auto release:', error.message);
    return { error: error.message };
  }
}

module.exports = { processNoShowAutoRelease };
