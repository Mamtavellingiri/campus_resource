const prisma = require('../config/prisma');

// @desc    Create feedback
// @route   POST /api/feedback
// @access  Private
exports.create = async (req, res) => {
  try {
    const { resourceId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!resourceId || !rating) {
      return res.status(400).json({
        success: false,
        message: '❌ Resource ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '❌ Rating must be between 1 and 5'
      });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(resourceId) }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        resourceId: parseInt(resourceId),
        rating: parseInt(rating),
        comment: comment || null
      }
    });

    res.status(201).json({
      success: true,
      message: '✅ Feedback submitted successfully!',
      feedback
    });

  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private
exports.getAll = async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        resource: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get feedback by resource
// @route   GET /api/feedback/resource/:resourceId
// @access  Private
exports.getByResource = async (req, res) => {
  try {
    const resourceId = parseInt(req.params.resourceId);

    const feedbacks = await prisma.feedback.findMany({
      where: { resourceId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating
    const avgRating = feedbacks.length > 0
      ? Math.round(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length * 10) / 10
      : 0;

    res.json({
      success: true,
      count: feedbacks.length,
      averageRating: avgRating,
      feedbacks
    });

  } catch (error) {
    console.error('Get feedback by resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};