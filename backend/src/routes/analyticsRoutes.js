const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/energy', authMiddleware, analyticsController.getEnergyAnalytics);
router.get('/eco-scores', authMiddleware, analyticsController.getEcoScores);

module.exports = router;