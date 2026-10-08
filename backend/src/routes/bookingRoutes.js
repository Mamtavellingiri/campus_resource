const express = require('express');
const {
  checkAvailability,
  recommendResources,
  getMyTeachingAssignments,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  approveBooking,
  rejectBooking
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/check-availability', checkAvailability);
router.post('/recommend', recommendResources);
router.get('/my-assignments', authorize(['FACULTY', 'ADMIN']), getMyTeachingAssignments);


router.get('/', getBookings);
router.post('/', createBooking);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', rescheduleBooking);

// Only administrators can approve or reject booking requests.
router.post('/:id/approve', authorize(['ADMIN']), approveBooking);
router.post('/:id/reject', authorize(['ADMIN']), rejectBooking);

module.exports = router;
