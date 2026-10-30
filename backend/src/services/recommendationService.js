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
    eventType,
    date,
    startTime,
    endTime,
    attendeeCount = 1,
    requiredFacilities = [],
    preferredBuildingId
  } = params;

  const headcount = Math.max(1, parseInt(attendeeCount, 10) || 1);
  const normalizedType = typeof resourceType === 'string' ? resourceType.trim() : '';
  const normalizedEventType = typeof eventType === 'string' ? eventType.trim().toUpperCase() : '';

  if (!date || !startTime || !endTime || startTime >= endTime) {
    return [];
  }

  const normalizeTypeLabel = (value) => {
    if (!value || typeof value !== 'string') return '';
    return value.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  };

  const resolveRequestedType = () => {
    if (normalizedType) {
      return normalizedType;
    }

    if (normalizedEventType === 'MEETING') {
      return 'MEETING_ROOM';
    }

    return '';
  };

  const matchesRequestedType = (resource) => {
    const requested = resolveRequestedType();
    if (!requested) return true;

    const category = resource?.type?.category || '';
    const name = resource?.type?.name || resource?.name || '';
    const requestedNormalized = normalizeTypeLabel(requested);
    const categoryNormalized = normalizeTypeLabel(category);
    const nameNormalized = normalizeTypeLabel(name);

    return categoryNormalized === requestedNormalized || nameNormalized === requestedNormalized ||
      categoryNormalized.includes(requestedNormalized) || nameNormalized.includes(requestedNormalized);
  };

  const buildCandidateQuery = () => {
    return prisma.resource.findMany({
      where: {
        status: 'AVAILABLE',
        isArchived: false,
        OR: [{ maintenanceStatus: null }, { maintenanceStatus: 'NONE' }],
        capacity: { gte: headcount },
        operatingHoursStart: { lte: startTime },
        operatingHoursEnd: { gte: endTime }
      },
      include: {
        type: true,
        building: true,
        maintenances: {
          where: { status: { in: ['REPORTED', 'IN_PROGRESS'] } }
        },
        bookings: {
          where: {
            date,
            status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] }
          }
        }
      }
    });
  };

  const scoreCandidates = async (candidateResources) => {
    let durationHours = 2.0;
    if (startTime && endTime) {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);
    }

    const scoredCandidates = [];

    for (const res of candidateResources) {
      if (
        res.maintenances.length > 0 ||
        (res.maintenanceStatus && res.maintenanceStatus !== 'NONE')
      ) {
        continue;
      }

      const hasConflict = Boolean(startTime && endTime) && res.bookings.some((b) => {
        return (startTime < b.endTime && endTime > b.startTime);
      });

      if (hasConflict) {
        continue;
      }

      let capacityScore = 0;
      if (res.capacity >= headcount) {
        const ratio = headcount / res.capacity;
        if (ratio >= 0.6 && ratio <= 1.0) capacityScore = 100;
        else if (ratio >= 0.3) capacityScore = 80;
        else capacityScore = 60;
      } else {
        capacityScore = 10;
      }

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

      let locationScore = 80;
      if (preferredBuildingId && res.buildingId === preferredBuildingId) {
        locationScore = 100;
      }

      const suitabilityScore = Math.round(
        (capacityScore * 0.35) +
        (facilityScore * 0.30) +
        (ecoMetrics.ecoScoreCalculated * 0.20) +
        (locationScore * 0.15)
      );

      const reasons = [];
      reasons.push(`Matches capacity requirement (${headcount} people in room size of ${res.capacity})`);
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

    scoredCandidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    return scoredCandidates;
  };

  let candidateResources = await buildCandidateQuery();

  if (resolveRequestedType()) {
    candidateResources = candidateResources.filter((resource) => matchesRequestedType(resource));
  }

  return scoreCandidates(candidateResources);
}

module.exports = { getSmartRecommendations };
