const prisma = require('../config/prisma');

const submitFeedback = async (req, res) => {
  try {
    const { bookingId, rating, comments, resourceCondition, cleanliness, equipmentQuality } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'bookingId and rating (1-5) are required.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only leave feedback for your own bookings.' });
    }

    if (booking.status !== 'CHECKED_OUT') {
      return res.status(400).json({ success: false, message: 'Feedback can only be submitted for completed (checked-out) bookings.' });
    }

    const existingFeedback = await prisma.feedback.findFirst({ where: { bookingId } });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback has already been submitted for this booking.' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        bookingId,
        userId: req.user.id,
        resourceId: booking.resourceId,
        rating: parseInt(rating, 10),
        comments,
        resourceCondition: resourceCondition || 'EXCELLENT',
        cleanliness: cleanliness || 'EXCELLENT',
        equipmentQuality: equipmentQuality || 'EXCELLENT'
      },
      include: { resource: true }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SUBMIT_FEEDBACK',
        entity: 'FEEDBACK',
        entityId: feedback.id,
        details: `Submitted rating ${rating}/5 for ${feedback.resource.name}`
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      feedback
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit feedback.', error: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: { select: { name: true, role: true, department: true } },
        resource: { select: { id: true, name: true, roomNumber: true } },
        booking: { select: { bookingCode: true, date: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: feedbacks.length, feedbacks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback list.', error: error.message });
  }
};

module.exports = { submitFeedback, getAllFeedback };
