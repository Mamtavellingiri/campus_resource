const express = require('express');
const router = express.Router();
const checkInController = require('../controllers/checkInController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/scan', authMiddleware, checkInController.scan);
router.post('/checkout', authMiddleware, checkInController.checkout);
router.get('/booking/:bookingId', authMiddleware, checkInController.getBookingStatus);

module.exports = router;