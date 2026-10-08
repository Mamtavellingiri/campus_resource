/**
 * Calculates estimated energy consumption (kWh) and Eco Score (0-100) for a booking.
 */
function calculateBookingEnergyAndEcoScore(resource, attendeeCount, durationHours) {
  const capacity = resource.capacity || 1;
  const baseKw = resource.basePowerConsumptionKw || 1.5;
  const buildingEfficiency = resource.building?.energyEfficiencyRating || resource.energyEfficiencyRating || 85;

  // Over-allocation penalty (e.g. booking 350-seat auditorium for 10 people)
  const occupancyRatio = Math.min(1.0, attendeeCount / capacity);
  let wastageFactor = 1.0;
  if (occupancyRatio < 0.25) {
    wastageFactor = 1.5; // High energy waste per person
  } else if (occupancyRatio < 0.5) {
    wastageFactor = 1.2;
  }

  // Equipment load estimation based on facilities
  let equipmentLoadKw = 0.5;
  try {
    const facilities = JSON.parse(resource.facilities || '[]');
    if (facilities.some(f => f.toLowerCase().includes('workstation') || f.toLowerCase().includes('computer'))) {
      equipmentLoadKw += (attendeeCount * 0.08); // 80W per PC workstation
    }
    if (facilities.some(f => f.toLowerCase().includes('projector') || f.toLowerCase().includes('display'))) {
      equipmentLoadKw += 0.4;
    }
    const acPattern = /air.?conditioning|a\/c|\bac\b|hvac/i;
    if (facilities.some(f => acPattern.test(f))) {
      equipmentLoadKw += 1.5 * wastageFactor;
    }
  } catch (e) {
    // fallback
  }

  const totalPowerKw = (baseKw + equipmentLoadKw) * (1 - (buildingEfficiency - 70) / 200);
  const estimatedEnergyKwh = Number((totalPowerKw * durationHours).toFixed(2));

  // Eco score calculation: Higher is greener
  // Base 100 - wastage penalties + building efficiency boost
  let rawEcoScore = Math.round(buildingEfficiency * 0.6 + occupancyRatio * 30 + (1 / (baseKw + 0.1)) * 10);
  const ecoScoreCalculated = Math.min(100, Math.max(40, rawEcoScore));

  let ratingLabel = 'Optimal Eco Choice';
  if (ecoScoreCalculated >= 90) ratingLabel = 'Low Energy / Eco Choice';
  else if (ecoScoreCalculated >= 75) ratingLabel = 'Moderate Energy Usage';
  else ratingLabel = 'High Energy Consumption';

  return {
    estimatedEnergyKwh,
    ecoScoreCalculated,
    ratingLabel,
    occupancyRatio: Math.round(occupancyRatio * 100)
  };
}

module.exports = { calculateBookingEnergyAndEcoScore };
