const { getBlackoutDates } = require('../services/settingsService');
const { getNowInTz } = require('./time');

const MAX_BOOKING_DURATION_MINUTES = 4 * 60;
const MAX_ACTIVE_BOOKINGS = 5;

const getBookingPolicyMessage = async ({ date, startTime, endTime }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Invalid date format (YYYY-MM-DD).';
  }
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime) || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
    return 'Invalid time format (HH:MM).';
  }
  if (startTime >= endTime) {
    return 'End time must be after start time.';
  }

  const now = getNowInTz();
  const nowTime = `${String(Math.floor(now.minutes / 60)).padStart(2, '0')}:${String(now.minutes % 60).padStart(2, '0')}`;
  if (date < now.date) {
    return 'Date cannot be in the past.';
  }
  if (date === now.date && startTime <= nowTime) {
    return 'Cannot book a time slot that has already passed.';
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if ((endHour * 60 + endMinute) - (startHour * 60 + startMinute) > MAX_BOOKING_DURATION_MINUTES) {
    return 'Maximum booking duration is 4 hours.';
  }
  if ((await getBlackoutDates()).includes(date)) {
    return `Bookings are not allowed on ${date} because it is a campus blackout date.`;
  }
  return null;
};

const getActiveBookingFilter = (userId, excludeBookingId) => {
  const now = getNowInTz();
  const nowTime = `${String(Math.floor(now.minutes / 60)).padStart(2, '0')}:${String(now.minutes % 60).padStart(2, '0')}`;
  const where = {
    userId,
    status: { in: ['PENDING', 'APPROVED'] },
    OR: [
      { date: { gt: now.date } },
      { date: now.date, startTime: { gt: nowTime } }
    ]
  };
  if (excludeBookingId) where.id = { not: excludeBookingId };
  return where;
};

module.exports = {
  MAX_ACTIVE_BOOKINGS,
  MAX_BOOKING_DURATION_MINUTES,
  getActiveBookingFilter,
  getBookingPolicyMessage
};
