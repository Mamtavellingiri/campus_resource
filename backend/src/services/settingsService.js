const prisma = require('../config/prisma');

/** Grace period (minutes) for check-in, from SystemSetting `grace_period_minutes` (default 15). */
async function getGraceMinutes() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'grace_period_minutes' }
  });
  const parsed = setting ? parseInt(setting.value, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 15;
}

module.exports = { getGraceMinutes };
