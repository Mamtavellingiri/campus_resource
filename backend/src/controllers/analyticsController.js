const prisma = require('../config/prisma');

// @desc    Get energy analytics
// @route   GET /api/analytics/energy
// @access  Private
exports.getEnergyAnalytics = async (req, res) => {
  try {
    // Get all resources with energy data
    const resources = await prisma.resource.findMany({
      where: {
        basePowerConsumptionKw: { not: null }
      },
      select: {
        id: true,
        name: true,
        building: true,
        ecoScore: true,
        basePowerConsumptionKw: true
      }
    });

    // Get booking statistics
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: {
        status: 'CHECKED_IN'
      }
    });

    // Calculate estimated energy consumption
    let totalEnergy = 0;
    let ecoScores = [];

    resources.forEach(resource => {
      if (resource.basePowerConsumptionKw) {
        totalEnergy += resource.basePowerConsumptionKw;
      }
      if (resource.ecoScore) {
        ecoScores.push(resource.ecoScore);
      }
    });

    const avgEcoScore = ecoScores.length > 0
      ? Math.round(ecoScores.reduce((a, b) => a + b, 0) / ecoScores.length)
      : 0;

    // Building breakdown
    const buildingMap = {};
    resources.forEach(resource => {
      if (!buildingMap[resource.building]) {
        buildingMap[resource.building] = {
          building: resource.building,
          energy: 0,
          count: 0
        };
      }
      buildingMap[resource.building].energy += resource.basePowerConsumptionKw || 0;
      buildingMap[resource.building].count += 1;
    });

    const buildingBreakdown = Object.values(buildingMap);

    res.json({
      success: true,
      data: {
        totalResources: resources.length,
        totalBookings,
        activeBookings,
        totalEnergyConsumption: Math.round(totalEnergy * 100) / 100,
        averageEcoScore: avgEcoScore,
        buildingBreakdown,
        resources: resources.map(r => ({
          ...r,
          energyUsageKwh: r.basePowerConsumptionKw
        }))
      }
    });

  } catch (error) {
    console.error('Energy analytics error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get eco scores
// @route   GET /api/analytics/eco-scores
// @access  Private
exports.getEcoScores = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: {
        ecoScore: { not: null }
      },
      select: {
        id: true,
        name: true,
        building: true,
        ecoScore: true,
        basePowerConsumptionKw: true
      },
      orderBy: {
        ecoScore: 'desc'
      }
    });

    // Group by building
    const buildingMap = {};
    resources.forEach(resource => {
      if (!buildingMap[resource.building]) {
        buildingMap[resource.building] = {
          building: resource.building,
          resources: [],
          avgScore: 0,
          totalScore: 0,
          count: 0
        };
      }
      buildingMap[resource.building].resources.push(resource);
      buildingMap[resource.building].totalScore += resource.ecoScore || 0;
      buildingMap[resource.building].count += 1;
    });

    Object.values(buildingMap).forEach(building => {
      building.avgScore = Math.round(building.totalScore / building.count);
    });

    const buildingScores = Object.values(buildingMap);

    res.json({
      success: true,
      data: {
        topResources: resources.slice(0, 5),
        buildingScores,
        allResources: resources
      }
    });

  } catch (error) {
    console.error('Eco scores error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};