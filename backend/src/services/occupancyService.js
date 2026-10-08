const prisma = require('../config/prisma');
const { getNowInTz, toMinutes } = require('../utils/time');

/**
 * "In use right now" is derived from bookings, NOT stored on Resource.status.
 * A resource is occupied if today it has:
 *  - a CHECKED_IN booking, or
 *  - an APPROVED booking whose time window contains the current time.
 * Returns a Set of resource ids.
 */
async function getOccupiedResourceIds() {
  const now = getNowInTz();

  const bookings = await prisma.booking.findMany({
    where: {
      date: now.date,
      status: { in: ['CHECKED_IN', 'APPROVED'] }
    },
    select: { resourceId: true, status: true, startTime: true, endTime: true }
  });

  const occupied = new Set();
  for (const b of bookings) {
    if (b.status === 'CHECKED_IN') {
      occupied.add(b.resourceId);
    } else if (now.minutes >= toMinutes(b.startTime) && now.minutes < toMinutes(b.endTime)) {
      occupied.add(b.resourceId);
    }
  }
  return occupied;
}

module.exports = { getOccupiedResourceIds };
