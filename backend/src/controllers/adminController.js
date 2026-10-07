const prisma = require('../config/prisma');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const id = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !['ADMIN', 'FACULTY', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid role'
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      }
    });

    res.json({
      success: true,
      message: '✅ User role updated successfully!',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get all bookings (admin view)
// @route   GET /api/admin/bookings
// @access  Private (Admin only)
exports.getAllBookings = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin only)
exports.updateBookingStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid status'
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        resource: true
      }
    });

    // If booking is approved, update resource status to BOOKED
    if (status === 'APPROVED') {
      await prisma.resource.update({
        where: { id: booking.resourceId },
        data: { status: 'BOOKED' }
      });
    }

    // If booking is rejected or cancelled, release resource
    if (status === 'REJECTED' || status === 'CANCELLED') {
      await prisma.resource.update({
        where: { id: booking.resourceId },
        data: { status: 'AVAILABLE' }
      });
    }

    res.json({
      success: true,
      message: `✅ Booking ${status.toLowerCase()} successfully!`,
      booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};