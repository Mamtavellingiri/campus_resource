const prisma = require('../config/prisma');

const submitFeedback = async (req, res) => {
  try {
    const { bookingId, rating, comments, resourceCondition, cleanliness, equipmentQuality } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'bookingId and rating (1-5) are required.' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
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
