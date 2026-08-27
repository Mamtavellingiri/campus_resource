const prisma = require('../config/prisma');
const { calculateBookingEnergyAndEcoScore } = require('./ecoService');

/**
 * AI Smart Recommendation Engine
 * Scores candidate resources against user query parameters:
 * - resourceType
 * - date, startTime, endTime
 * - attendeeCount
 * - requiredFacilities (array)
 * - preferredBuildingId
 */
async function getSmartRecommendations(params) {
  const {
    resourceType,
    date,
    startTime,
    endTime,
    attendeeCount = 1,
    requiredFacilities = [],
    preferredBuildingId
  } = params;

  // 1. Fetch available resources (exclude MAINTENANCE and OUT_OF_SERVICE)
  const whereClause = {
    status: 'AVAILABLE'
  };

  if (resourceType) {
    whereClause.type = { category: resourceType };
  }

  const candidateResources = await prisma.resource.findMany({
    where: whereClause,
    include: {
      type: true,
      building: true,
      bookings: {
        where: {
          date: date,
          status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] }
        }
      }
    }
  });

  // Calculate duration in hours
  let durationHours = 2.0;
  if (startTime && endTime) {
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);
  }

  const scoredCandidates = [];

  for (const res of candidateResources) {
    // 2. Check for time overlap conflict
    const hasConflict = res.bookings.some(b => {
      return (startTime < b.endTime && endTime > b.startTime);
    });

    if (hasConflict) {
      continue; // Skip occupied resources
    }

    // 3. Capacity suitability (0 - 100)
    let capacityScore = 0;
    if (res.capacity >= attendeeCount) {
      const ratio = attendeeCount / res.capacity;
      if (ratio >= 0.6 && ratio <= 1.0) capacityScore = 100;
      else if (ratio >= 0.3) capacityScore = 80;
      else capacityScore = 60; // Room is too big for a tiny group
    } else {
      capacityScore = 10; // Under capacity
    }

    // 4. Facilities match (0 - 100)
    let facilityScore = 100;
    let resFacilities = [];
    try {
      resFacilities = JSON.parse(res.facilities || '[]');
    } catch (e) {}

    const matchedFacilities = [];
    const missingFacilities = [];

    if (requiredFacilities && requiredFacilities.length > 0) {
      let matchedCount = 0;
      for (const reqFac of requiredFacilities) {
        const found = resFacilities.some(f => f.toLowerCase().includes(reqFac.toLowerCase()));
        if (found) {
          matchedCount++;
          matchedFacilities.push(reqFac);
        } else {
          missingFacilities.push(reqFac);
        }
      }
      facilityScore = Math.round((matchedCount / requiredFacilities.length) * 100);
    }

    // 5. Eco Score & Energy calculation
    const ecoMetrics = calculateBookingEnergyAndEcoScore(res, attendeeCount, durationHours);

    // 6. Location preference score
    let locationScore = 80;
    if (preferredBuildingId && res.buildingId === preferredBuildingId) {
      locationScore = 100;
    }

    // Overall Weighted Suitability Score (0 - 100)
    // Suitability = (Capacity * 35%) + (Facilities * 30%) + (Eco * 20%) + (Location * 15%)
    const suitabilityScore = Math.round(
      (capacityScore * 0.35) +
      (facilityScore * 0.30) +
      (ecoMetrics.ecoScoreCalculated * 0.20) +
      (locationScore * 0.15)
    );

    // Build human-readable explanations ("WHY RECOMMENDED")
    const reasons = [];
    reasons.push(`Matches capacity requirement (${attendeeCount} people in room size of ${res.capacity})`);
    if (ecoMetrics.ecoScoreCalculated >= 90) {
      reasons.push(`High Eco Score (${ecoMetrics.ecoScoreCalculated}/100) - estimated low energy usage of ~${ecoMetrics.estimatedEnergyKwh} kWh`);
    } else {
      reasons.push(`Eco Score rated at ${ecoMetrics.ecoScoreCalculated}/100`);
    }

    if (matchedFacilities.length > 0) {
      reasons.push(`Includes requested facilities: ${matchedFacilities.join(', ')}`);
    }
    if (res.building) {
      reasons.push(`Located in ${res.building.name} (Floor ${res.floor}, Room ${res.roomNumber})`);
    }

    scoredCandidates.push({
      resource: res,
      suitabilityScore,
      ecoScore: ecoMetrics.ecoScoreCalculated,
      estimatedEnergyKwh: ecoMetrics.estimatedEnergyKwh,
      ratingLabel: ecoMetrics.ratingLabel,
      matchedFacilities,
      missingFacilities,
      reasons
    });
  }

  // Sort descending by suitability score
  scoredCandidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return scoredCandidates;
}

module.exports = { getSmartRecommendations };
