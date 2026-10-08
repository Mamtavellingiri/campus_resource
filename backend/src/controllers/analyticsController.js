const prisma = require('../config/prisma');
const { getNowInTz } = require('../utils/time');

const getSystemOverview = async (req, res) => {
  try {
    const totalResources = await prisma.resource.count();
    const availableResources = await prisma.resource.count({ where: { status: 'AVAILABLE' } });
    const maintenanceResources = await prisma.resource.count({ where: { status: 'MAINTENANCE' } });

    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({ where: { status: 'CHECKED_IN' } });
    const pendingApprovals = await prisma.booking.count({ where: { status: 'PENDING' } });
    const noShowCount = await prisma.booking.count({ where: { status: 'NO_SHOW' } });

    const todayStr = getNowInTz().date;
    const todayBookingsCount = await prisma.booking.count({ where: { date: todayStr } });

    // Utilization calculation
    const totalResourceHours = totalResources * 12; // 12 operating hrs/day
    const utilizationRate = totalResourceHours > 0
      ? Math.min(100, Math.round(((activeBookings + todayBookingsCount) * 2 / totalResourceHours) * 100))
      : 0;

    // Energy Metrics (kWh) — no fallback hardcodes, show 0 if empty
    const energyData = await prisma.booking.aggregate({
      _sum: { estimatedEnergyKwh: true },
      _avg: { ecoScoreCalculated: true }
    });

    const totalEnergyKwh = Number((energyData._sum.estimatedEnergyKwh || 0).toFixed(1));
    const avgEcoScore = Math.round(energyData._avg.ecoScoreCalculated || 0);
    // Estimated savings: based on optimized eco bookings vs baseline (15% efficiency gain)
    const estimatedSavingsKwh = Number((totalEnergyKwh * 0.15).toFixed(1));
    const savingsPercent = totalEnergyKwh > 0 ? Math.round(15) : 0;

    return res.json({
      success: true,
      metrics: {
        totalResources,
        availableResources,
        maintenanceResources,
        totalBookings,
        activeBookings,
        pendingApprovals,
        noShowCount,
        todayBookingsCount,
        utilizationRate,
        totalEnergyKwh,
        avgEcoScore,
        estimatedSavingsKwh,
        savingsPercent
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch overview metrics.', error: error.message });
  }
};

const getEnergyAnalytics = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { resource: { include: { building: true, type: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Building Energy Breakdown — from real bookings
    const buildingMap = {};
    bookings.forEach(b => {
      const bName = b.resource?.building?.name || 'Main Campus';
      if (!buildingMap[bName]) {
        buildingMap[bName] = { name: bName, totalEnergyKwh: 0, bookingCount: 0, scoreSum: 0 };
      }
      buildingMap[bName].totalEnergyKwh += b.estimatedEnergyKwh || 0;
      buildingMap[bName].bookingCount += 1;
      buildingMap[bName].scoreSum += b.ecoScoreCalculated || 0;
    });

    const buildingBreakdown = Object.values(buildingMap).map(b => ({
      name: b.name,
      totalEnergyKwh: Number(b.totalEnergyKwh.toFixed(1)),
      bookingCount: b.bookingCount,
      avgEcoScore: b.bookingCount > 0 ? Math.round(b.scoreSum / b.bookingCount) : 0
    }));

    // Monthly Eco Trend — computed from REAL bookings grouped by YYYY-MM
    const monthlyMap = {};
    bookings.forEach(b => {
      if (!b.date) return;
      const ym = b.date.substring(0, 7); // 'YYYY-MM'
      if (!monthlyMap[ym]) {
        monthlyMap[ym] = { consumptionKwh: 0, ecoScoreSum: 0, count: 0 };
      }
      monthlyMap[ym].consumptionKwh += b.estimatedEnergyKwh || 0;
      monthlyMap[ym].ecoScoreSum += b.ecoScoreCalculated || 0;
      monthlyMap[ym].count += 1;
    });

    // Build last 6 months of data (fill zeros for months with no bookings)
    const now = new Date();
    const ecoTrendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const entry = monthlyMap[ym];
      const consumption = entry ? Number(entry.consumptionKwh.toFixed(1)) : 0;
      ecoTrendData.push({
        month: monthLabel,
        consumptionKwh: consumption,
        savedKwh: Number((consumption * 0.15).toFixed(1)),
        ecoScore: entry && entry.count > 0 ? Math.round(entry.ecoScoreSum / entry.count) : 0
      });
    }

    // Summary KPIs
    const totalEnergyKwh = buildingBreakdown.reduce((s, b) => s + b.totalEnergyKwh, 0);
    const allEcoScores = bookings.map(b => b.ecoScoreCalculated).filter(Boolean);
    const avgEcoScore = allEcoScores.length > 0
      ? Math.round(allEcoScores.reduce((s, v) => s + v, 0) / allEcoScores.length)
      : 0;

    // Top green vs most consuming resources
    const topGreenResources = await prisma.resource.findMany({
      take: 5,
      orderBy: { ecoScore: 'desc' },
      include: { building: true, type: true }
    });

    const topConsumingResources = await prisma.resource.findMany({
      take: 5,
      orderBy: { basePowerConsumptionKw: 'desc' },
      include: { building: true, type: true }
    });

    return res.json({
      success: true,
      analytics: {
        summary: {
          totalEnergyKwh: Number(totalEnergyKwh.toFixed(1)),
          savedKwh: Number((totalEnergyKwh * 0.15).toFixed(1)),
          avgEcoScore,
          co2OffsetKg: Number((totalEnergyKwh * 0.114).toFixed(1)), // 0.114 kg CO2/kWh grid factor
          savingsPercent: totalEnergyKwh > 0 ? 15 : 0
        },
        buildingBreakdown,
        ecoTrendData,
        topGreenResources,
        topConsumingResources
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch energy analytics.', error: error.message });
  }
};

const getUtilizationAnalytics = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        type: true,
        building: true,
        _count: { select: { bookings: true } }
      }
    });

    const resourceUtilization = resources.map(r => ({
      name: r.name,
      type: r.type.category,
      building: r.building.name,
      totalBookings: r._count.bookings,
      capacity: r.capacity,
      ecoScore: r.ecoScore
    }));

    return res.json({
      success: true,
      resourceUtilization
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch utilization analytics.', error: error.message });
  }
};

module.exports = {
  getSystemOverview,
  getEnergyAnalytics,
  getUtilizationAnalytics
};
