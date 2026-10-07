const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, bookingController.create);
router.get('/my', authMiddleware, bookingController.getMyBookings);
router.get('/:id', authMiddleware, bookingController.getOne);
router.put('/:id/cancel', authMiddleware, bookingController.cancel);
router.post('/check-availability', authMiddleware, bookingController.checkAvailability);
router.post('/recommend', authMiddleware, bookingController.recommend);

module.exports = router;