const express = require('express');
const { getSystemOverview, getEnergyAnalytics, getUtilizationAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/overview', getSystemOverview);
router.get('/energy', getEnergyAnalytics);
router.get('/utilization', getUtilizationAnalytics);

module.exports = router;
