/**
 * Timezone-safe date/time helpers.
 * All "today" / "now" decisions in the app must go through here so the server
 * never mixes UTC dates with local hours.
 *
 * Reads TIMEZONE from the environment (default Asia/Kolkata).
 */

const DEFAULT_TZ = 'Asia/Kolkata';

const getTimezone = () => process.env.TIMEZONE || DEFAULT_TZ;

/** 'HH:MM' -> minutes since midnight */
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

/** Returns { date: 'YYYY-MM-DD', minutes: number } for the given instant in the configured timezone. */
const getNowInTz = (instant = new Date(), tz = getTimezone()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(instant);

  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute'))
  };
};

/** Formats any Date as YYYY-MM-DD in the configured timezone (used by the seed script). */
const formatDateInTz = (date, tz = getTimezone()) => getNowInTz(date, tz).date;

const CHECKIN_EARLY_MINUTES = 15;

/**
 * Decides whether a booking may be checked in right now.
 * Allowed: on the booking date, from 15 min before start until the grace period ends
 * (the same moment the no-show job starts marking it NO_SHOW).
 */
const evaluateCheckInWindow = (booking, graceMinutes = 15, now = getNowInTz()) => {
  if (booking.date !== now.date) {
    return {
      allowed: false,
      reason: `Check-in is only possible on the booking date (${booking.date}).`
    };
  }

  const start = toMinutes(booking.startTime);
  const opensAt = start - CHECKIN_EARLY_MINUTES;
  const closesAt = start + graceMinutes;

  if (now.minutes < opensAt) {
    return {
      allowed: false,
      reason: `Check-in opens ${CHECKIN_EARLY_MINUTES} minutes before the start time (${booking.startTime}).`
    };
  }
  if (now.minutes >= closesAt) {
    return {
      allowed: false,
      reason: `The ${graceMinutes}-minute check-in grace period has ended.`
    };
  }
  return { allowed: true };
};

module.exports = {
  getTimezone,
  toMinutes,
  getNowInTz,
  formatDateInTz,
  evaluateCheckInWindow,
  CHECKIN_EARLY_MINUTES
};
