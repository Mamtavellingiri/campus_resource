const prisma = require('../config/prisma');

// @desc    Scan QR Code and Check-in
// @route   POST /api/checkin/scan
// @access  Private
exports.scan = async (req, res) => {
  try {
    const { bookingCode } = req.body;
    const userId = req.user.id;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        message: '❌ Booking code is required'
      });
    }

    // Find booking by code
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        resource: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '❌ Booking not found'
      });
    }

    // Check if booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '❌ You are not authorized to check-in to this booking'
      });
    }

    // Check if booking is approved
    if (booking.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `❌ Booking is ${booking.status.toLowerCase()}. Only approved bookings can be checked in`
      });
    }

    // Check if already checked in
    if (booking.status === 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: '❌ Already checked in'
      });
    }

    // Update booking status to CHECKED_IN
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date()
      },
      include: {
        resource: true
      }
    });

    // Update resource status to BOOKED
    await prisma.resource.update({
      where: { id: booking.resourceId },
      data: { status: 'BOOKED' }
    });

    res.json({
      success: true,
      message: '✅ Check-in successful!',
      booking: updated
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error during check-in'
    });
  }
};

// @desc    Check-out
// @route   POST /api/checkin/checkout
// @access  Private
exports.checkout = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: '❌ Booking ID is required'
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '❌ Booking not found'
      });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '❌ You are not authorized to check-out this booking'
      });
    }

    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({
        success: false,
        message: '❌ Booking is not checked in'
      });
    }

    // Update booking status to CHECKED_OUT
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CHECKED_OUT',
        checkedOutAt: new Date()
      }
    });

    // Release resource
    await prisma.resource.update({
      where: { id: booking.resourceId },
      data: { status: 'AVAILABLE' }
    });

    res.json({
      success: true,
      message: '✅ Check-out successful!',
      booking: updated
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error during check-out'
    });
  }
};

// @desc    Get booking status
// @route   GET /api/checkin/booking/:bookingId
// @access  Private
exports.getBookingStatus = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        resource: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: '❌ Booking not found'
      });
    }

    if (booking.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Not authorized'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Get booking status error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};