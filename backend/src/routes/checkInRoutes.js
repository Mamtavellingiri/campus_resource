const express = require('express');
const { processCheckIn, processCheckOut } = require('../controllers/checkInController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/scan', processCheckIn);
router.post('/checkout', processCheckOut);

module.exports = router;
