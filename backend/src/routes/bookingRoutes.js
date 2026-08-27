const express = require('express');
const {
  checkAvailability,
  recommendResources,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  approveBooking,
  rejectBooking
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/check-availability', checkAvailability);
router.post('/recommend', recommendResources);

router.use(authenticate);

router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

// Approval routes for Admin & Faculty
router.post('/:id/approve', authorize(['ADMIN', 'FACULTY']), approveBooking);
router.post('/:id/reject', authorize(['ADMIN', 'FACULTY']), rejectBooking);

module.exports = router;
