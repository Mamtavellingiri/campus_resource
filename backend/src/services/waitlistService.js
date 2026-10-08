const prisma = require('../config/prisma');
const { getNowInTz, toMinutes } = require('../utils/time');
const { calculateBookingEnergyAndEcoScore } = require('./ecoService');
const crypto = require('crypto');

/**
 * Promotes the oldest WAITING entry for a freed time slot.
 * Called whenever a booking is CANCELLED, REJECTED, or NO_SHOW.
 */
async function promoteNext(resourceId, date, startTime, endTime) {
  try {
    const now = getNowInTz();

    // Find oldest WAITING entry for this resource/date that fits the slot and hasn't started
    const candidates = await prisma.waitlistEntry.findMany({
      where: {
        resourceId,
        date,
        status: 'WAITING',
        startTime: { gte: startTime },
        endTime: { lte: endTime }
      },
      include: { user: true, resource: { include: { building: true } } },
      orderBy: { createdAt: 'asc' }
    });

    for (const entry of candidates) {
      // Skip if slot start time has passed today
      if (entry.date === now.date) {
        const [sH, sM] = entry.startTime.split(':').map(Number);
        if (sH * 60 + sM <= now.minutes) continue;
      }

      // Check that the slot is actually free now
      const conflict = await prisma.booking.findFirst({
        where: {
          resourceId: entry.resourceId,
          date: entry.date,
          status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
          AND: [
            { startTime: { lt: entry.endTime } },
            { endTime: { gt: entry.startTime } }
          ]
        }
      });

      if (conflict) continue; // still blocked, try next candidate

      // Determine initial booking status
      const autoApprove = ['ADMIN', 'FACULTY'].includes(entry.user.role);
      const newStatus = autoApprove ? 'APPROVED' : 'PENDING';

      // Calculate eco metrics
      const [sH2, sM2] = entry.startTime.split(':').map(Number);
      const [eH2, eM2] = entry.endTime.split(':').map(Number);
      const durationHours = Math.max(0.5, (eH2 * 60 + eM2 - (sH2 * 60 + sM2)) / 60);
      const eco = calculateBookingEnergyAndEcoScore(entry.resource, entry.attendeeCount, durationHours);

      await prisma.$transaction(async (tx) => {
        // Generate unique booking code
        let bookingCode;
        for (let i = 0; i < 5; i++) {
          const code = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const exists = await tx.booking.findUnique({ where: { bookingCode: code } });
          if (!exists) { bookingCode = code; break; }
        }
        if (!bookingCode) throw new Error('Failed to generate booking code for waitlist promotion');

        const qrData = JSON.stringify({
          bookingCode, userId: entry.userId, resourceId: entry.resourceId,
          date: entry.date, startTime: entry.startTime, endTime: entry.endTime,
          issuedAt: new Date().toISOString(), promotedFromWaitlist: true
        });

        // Create the booking
        await tx.booking.create({
          data: {
            bookingCode, userId: entry.userId, resourceId: entry.resourceId,
            purpose: entry.purpose, eventType: 'ACADEMIC',
            attendeeCount: entry.attendeeCount, requestedFacilities: '[]',
            date: entry.date, startTime: entry.startTime, endTime: entry.endTime,
            status: newStatus, qrCodeData: qrData,
            // A promoted student request remains visible in the new
            // year-scoped student timetable.
            year: entry.user.year || null,
            estimatedEnergyKwh: eco.estimatedEnergyKwh,
            ecoScoreCalculated: eco.ecoScoreCalculated
          }
        });

        // Mark waitlist entry as promoted
        await tx.waitlistEntry.update({
          where: { id: entry.id },
          data: { status: 'PROMOTED' }
        });

        // Notify user
        await tx.notification.create({
          data: {
            userId: entry.userId,
            title: '🎉 Waitlist Slot Opened!',
            message: `A slot opened up for ${entry.resource.name} on ${entry.date} (${entry.startTime}–${entry.endTime}). Your booking is now ${newStatus}.`,
            type: 'BOOKING_CREATED'
          }
        });
      });

      // Only promote one entry per freed slot
      break;
    }
  } catch (error) {
    console.error('❌ Waitlist promotion error:', error.message);
  }
}

/**
 * Marks WAITING entries whose start time has passed as EXPIRED.
 * Called from the cron job every minute.
 */
async function expireOldEntries() {
  try {
    const now = getNowInTz();

    // Expire past-date entries
    await prisma.waitlistEntry.updateMany({
      where: { date: { lt: now.date }, status: 'WAITING' },
      data: { status: 'EXPIRED' }
    });

    // Expire today's entries whose start time has passed
    const todayWaiting = await prisma.waitlistEntry.findMany({
      where: { date: now.date, status: 'WAITING' }
    });

    for (const entry of todayWaiting) {
      const [sH, sM] = entry.startTime.split(':').map(Number);
      if (sH * 60 + sM <= now.minutes) {
        await prisma.waitlistEntry.update({
          where: { id: entry.id },
          data: { status: 'EXPIRED' }
        });
      }
    }
  } catch (error) {
    console.error('❌ Waitlist expire error:', error.message);
  }
}

module.exports = { promoteNext, expireOldEntries };
