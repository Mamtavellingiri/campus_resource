const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/lock', authMiddleware, maintenanceController.lockResource);
router.post('/unlock', authMiddleware, maintenanceController.unlockResource);
router.get('/', authMiddleware, maintenanceController.getAll);

module.exports = router;