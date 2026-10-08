const express = require('express');
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/eco/summary
 * Basic eco-score summary across all resources/bookings.
 * This is a minimal placeholder — expand with real eco-dashboard
 * logic later if your project needs it (e.g. energy usage trends,
 * per-building eco scores, etc.)
 */
router.get('/summary', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, ecoScore: true, energyEfficiencyRating: true }
    });

    const avgEcoScore = resources.length > 0
      ? Math.round(resources.reduce((sum, r) => sum + r.ecoScore, 0) / resources.length)
      : 0;

    return res.json({
      success: true,
      averageEcoScore: avgEcoScore,
      resourceCount: resources.length,
      resources
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch eco summary.', error: error.message });
  }
});

module.exports = router;
