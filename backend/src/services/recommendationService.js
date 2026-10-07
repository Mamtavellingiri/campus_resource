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

  const headcount = Math.max(1, parseInt(attendeeCount, 10) || 1);
  const normalizedType = typeof resourceType === 'string' ? resourceType.trim() : '';

  const buildCandidateQuery = () => {
    return prisma.resource.findMany({
      where: {
      status: { notIn: ['MAINTENANCE', 'OUT_OF_SERVICE'] },
      capacity: { gte: headcount }
      },
      include: {
        bookings: {
          where: {
            ...(date ? { date } : { id: '__none__' }),
            status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] }
          }
        }
      }
    });
  };

  const scoreCandidates = async (candidateResources, applyTypeFilter) => {
    let durationHours = 2.0;
    if (startTime && endTime) {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);
    }

    const scoredCandidates = [];

    const normalizeType = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const filteredResources = applyTypeFilter
      ? candidateResources.filter((resource) => normalizeType(resource.type) === normalizeType(normalizedType))
      : candidateResources;

    for (const res of filteredResources) {
      const hasConflict = Boolean(startTime && endTime) && res.bookings.some((b) => {
        return startTime < b.endTime && endTime > b.startTime;
      });

      if (!hasConflict) {
        let capacityScore = 0;
        const ratio = headcount / res.capacity;
        if (ratio >= 0.6 && ratio <= 1.0) capacityScore = 100;
        else if (ratio >= 0.3) capacityScore = 80;
        else capacityScore = 60;

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
            const found = resFacilities.some((f) => f.toLowerCase().includes(reqFac.toLowerCase()));
            if (found) {
              matchedCount++;
              matchedFacilities.push(reqFac);
            } else {
              missingFacilities.push(reqFac);
            }
          }
          facilityScore = Math.round((matchedCount / requiredFacilities.length) * 100);
        }

        const ecoMetrics = calculateBookingEnergyAndEcoScore(res, headcount, durationHours);
        const locationScore = preferredBuildingId && res.building === preferredBuildingId ? 100 : 80;
        const suitabilityScore = Math.round(
          (capacityScore * 0.35) +
          (facilityScore * 0.30) +
          (ecoMetrics.ecoScoreCalculated * 0.20) +
          (locationScore * 0.15)
        );

        const reasons = [`Matches capacity requirement (${headcount} people in room size of ${res.capacity})`];
        if (ecoMetrics.ecoScoreCalculated >= 90) {
          reasons.push(`High Eco Score (${ecoMetrics.ecoScoreCalculated}/100) - estimated low energy usage of ~${ecoMetrics.estimatedEnergyKwh} kWh`);
        } else {
          reasons.push(`Eco Score rated at ${ecoMetrics.ecoScoreCalculated}/100`);
        }
        if (matchedFacilities.length > 0) {
          reasons.push(`Includes requested facilities: ${matchedFacilities.join(', ')}`);
        }
        if (res.building) {
          reasons.push(`Located in ${res.building} (Floor ${res.floor}, Room ${res.roomNumber})`);
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
    }

    scoredCandidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    return scoredCandidates;
  };

  const candidateResources = await buildCandidateQuery();
  let scoredCandidates = await scoreCandidates(candidateResources, Boolean(normalizedType));
  if (normalizedType && scoredCandidates.length === 0) {
    scoredCandidates = await scoreCandidates(candidateResources, false);
  }
  return scoredCandidates;
}

module.exports = { getSmartRecommendations };
