const express = require('express');
const { getSystemOverview, getEnergyAnalytics, getUtilizationAnalytics } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'FACULTY']));

router.get('/overview', getSystemOverview);
router.get('/energy', getEnergyAnalytics);
router.get('/utilization', getUtilizationAnalytics);

module.exports = router;
