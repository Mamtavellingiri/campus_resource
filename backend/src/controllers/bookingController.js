const prisma = require('../config/prisma');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
exports.create = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime, purpose, attendeeCount } = req.body;
    const userId = req.user.id;

    if (!resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '❌ Resource, date, start time, and end time are required'
      });
    }

    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(resourceId) }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    if (resource.status === 'MAINTENANCE') {
      return res.status(400).json({
        success: false,
        message: '❌ Resource is under maintenance'
      });
    }

    // Check for conflicting bookings
    const conflicts = await prisma.booking.findMany({
      where: {
        resourceId: parseInt(resourceId),
        date: date,
        status: { in: ['PENDING', 'APPROVED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: '❌ Resource is already booked for this time slot',
        conflicts
      });
    }

    // Generate unique booking code
    const bookingCode = `BK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        resourceId: parseInt(resourceId),
        date,
        startTime,
        endTime,
        purpose: purpose || '',
        attendeeCount: attendeeCount ? parseInt(attendeeCount) : null,
        bookingCode,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: '✅ Booking created successfully!',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        resource: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getOne = async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        resource: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '❌ Booking not found'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancel = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '❌ Booking not found'
      });
    }

    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Not authorized to cancel this booking'
      });
    }

    if (booking.status === 'CHECKED_IN' || booking.status === 'CHECKED_OUT') {
      return res.status(400).json({
        success: false,
        message: '❌ Cannot cancel a booking that has been checked in'
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: '✅ Booking cancelled successfully!',
      booking: updated
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Check availability
// @route   POST /api/bookings/check-availability
// @access  Private
exports.checkAvailability = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime } = req.body;

    if (!resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '❌ Resource, date, start time, and end time are required'
      });
    }

    const conflicts = await prisma.booking.findMany({
      where: {
        resourceId: parseInt(resourceId),
        date,
        status: { in: ['PENDING', 'APPROVED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    res.json({
      success: true,
      available: conflicts.length === 0,
      conflicts
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    AI Smart Recommendation
// @route   POST /api/bookings/recommend
// @access  Private
exports.recommend = async (req, res) => {
  try {
    const { attendees, resourceType, facility, date, startTime, endTime } = req.body;

    if (!attendees || !resourceType || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '❌ Attendees, resource type, date, start time, and end time are required'
      });
    }

    // Get all available resources of the requested type
    const resources = await prisma.resource.findMany({
      where: {
        type: resourceType,
        status: 'AVAILABLE',
        capacity: { gte: parseInt(attendees) }
      }
    });

    // Get booked resources for the time slot
    const booked = await prisma.booking.findMany({
      where: {
        date,
        status: { in: ['PENDING', 'APPROVED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      },
      select: { resourceId: true }
    });

    const bookedIds = booked.map(b => b.resourceId);

    // Filter available resources
    const available = resources.filter(r => !bookedIds.includes(r.id));

    // Score resources
    const scored = available.map(resource => {
      let score = 0;
      let reasons = [];

      // Capacity match
      if (resource.capacity >= parseInt(attendees)) {
        score += 30;
        reasons.push('✅ Matches capacity requirement');
      }

      // Eco score
      if (resource.ecoScore && resource.ecoScore > 70) {
        score += 20;
        reasons.push('✅ High eco-score');
      }

      // Facility match
      if (facility && resource.facilities.toLowerCase().includes(facility.toLowerCase())) {
        score += 20;
        reasons.push('✅ Has required facilities');
      }

      // Size efficiency
      const capacityRatio = parseInt(attendees) / resource.capacity;
      if (capacityRatio > 0.5 && capacityRatio < 0.9) {
        score += 30;
        reasons.push('✅ Optimal size for your group');
      }

      return {
        ...resource,
        score,
        reasons: reasons.length > 0 ? reasons : ['No specific match'],
        matchPercentage: Math.min(100, score + Math.floor(Math.random() * 10))
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, 5));

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};