const prisma = require('../config/prisma');
const { calculateBookingEnergyAndEcoScore } = require('../services/ecoService');
const { getSmartRecommendations } = require('../services/recommendationService');

/**
 * Check real-time availability and prevent double booking!
 */
const checkAvailability = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime } = req.body;

    if (!resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'resourceId, date, startTime, and endTime are required.' });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { type: true, building: true }
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
      return res.status(400).json({
        success: false,
        isAvailable: false,
        message: `Resource is currently ${resource.status} and cannot be booked.`
      });
    }

    // Overlap query: startTime < existing.endTime && endTime > existing.startTime
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        resourceId,
        date,
        status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      },
      include: { user: { select: { name: true, role: true } } }
    });

    if (overlappingBookings.length > 0) {
      const conflict = overlappingBookings[0];
      return res.status(409).json({
        success: false,
        isAvailable: false,
        message: `Resource already booked from ${conflict.startTime} to ${conflict.endTime} on ${date}.`,
        conflict: {
          bookingCode: conflict.bookingCode,
          purpose: conflict.purpose,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          bookedBy: conflict.user.name
        }
      });
    }

    return res.json({
      success: true,
      isAvailable: true,
      message: 'Resource is available for the requested time slot!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error checking availability.', error: error.message });
  }
};

/**
 * AI Smart Recommendation Endpoint
 */
const recommendResources = async (req, res) => {
  try {
    const {
      resourceType,
      date,
      startTime,
      endTime,
      attendeeCount = 1,
      requiredFacilities = [],
      preferredBuildingId
    } = req.body;

    const recommendations = await getSmartRecommendations({
      resourceType,
      date,
      startTime,
      endTime,
      attendeeCount,
      requiredFacilities,
      preferredBuildingId
    });

    return res.json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.', error: error.message });
  }
};

/**
 * Create a new Booking with conflict check
 */
const createBooking = async (req, res) => {
  try {
    const {
      resourceId,
      purpose,
      eventType = 'ACADEMIC',
      attendeeCount = 1,
      requestedFacilities = [],
      date,
      startTime,
      endTime,
      isRecurring = false,
      recurringPattern
    } = req.body;

    const userId = req.user.id;

    if (!resourceId || !purpose || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields.' });
    }

    // 1. Verify Resource Status
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { building: true }
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (['MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
      return res.status(400).json({
        success: false,
        message: `Resource is currently ${resource.status} and cannot be booked.`
      });
    }

    // 2. Strict Backend Double-Booking Conflict Check
    const existingConflict = await prisma.booking.findFirst({
      where: {
        resourceId,
        date,
        status: { in: ['APPROVED', 'CHECKED_IN', 'PENDING'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } }
        ]
      }
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `Resource already booked from ${existingConflict.startTime} to ${existingConflict.endTime} on ${date}.`
      });
    }

    // 3. Calculate Energy & Eco Score
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const durationHours = Math.max(0.5, (eH * 60 + eM - (sH * 60 + sM)) / 60);

    const eco = calculateBookingEnergyAndEcoScore(resource, attendeeCount, durationHours);

    // Auto approve for FACULTY or ADMIN, PENDING for STUDENT
    const initialStatus = (req.user.role === 'ADMIN' || req.user.role === 'FACULTY') ? 'APPROVED' : 'PENDING';
    const bookingCode = `BK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const qrData = JSON.stringify({
      bookingCode,
      userId,
      resourceId,
      date,
      startTime,
      endTime,
      issuedAt: new Date().toISOString()
    });

    const newBooking = await prisma.booking.create({
      data: {
        bookingCode,
        userId,
        resourceId,
        purpose,
        eventType,
        attendeeCount: parseInt(attendeeCount, 10),
        requestedFacilities: JSON.stringify(requestedFacilities),
        date,
        startTime,
        endTime,
        status: initialStatus,
        isRecurring: Boolean(isRecurring),
        recurringPattern,
        qrCodeData: qrData,
        estimatedEnergyKwh: eco.estimatedEnergyKwh,
        ecoScoreCalculated: eco.ecoScoreCalculated
      },
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { name: true, email: true, role: true, department: true } }
      }
    });

    // Create approval record if pre-approved
    if (initialStatus === 'APPROVED') {
      await prisma.bookingApproval.create({
        data: {
          bookingId: newBooking.id,
          approvedById: req.user.id,
          status: 'APPROVED',
          remarks: 'Auto-approved for Faculty/Admin role'
        }
      });
    }

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId,
        title: initialStatus === 'APPROVED' ? 'Booking Confirmed & QR Ready' : 'Booking Request Submitted',
        message: initialStatus === 'APPROVED'
          ? `Your booking for ${resource.name} on ${date} (${startTime} - ${endTime}) is APPROVED.`
          : `Your booking request for ${resource.name} is PENDING admin approval.`,
        type: initialStatus === 'APPROVED' ? 'BOOKING_APPROVED' : 'BOOKING_CREATED'
      }
    });

    // Log Audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_BOOKING',
        entity: 'BOOKING',
        entityId: newBooking.id,
        details: `Created booking ${bookingCode} for ${resource.name} on ${date}`
      }
    });

    return res.status(201).json({
      success: true,
      message: initialStatus === 'APPROVED' ? 'Booking confirmed successfully!' : 'Booking request submitted for approval.',
      booking: {
        ...newBooking,
        requestedFacilities: JSON.parse(newBooking.requestedFacilities || '[]')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create booking.', error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const { status, date, resourceId } = req.query;
    const where = {};

    // Students only see their own bookings; Faculty sees theirs + department requests; Admin sees all
    if (req.user.role === 'STUDENT') {
      where.userId = req.user.id;
    } else if (req.user.role === 'FACULTY' && req.query.view !== 'all') {
      where.OR = [
        { userId: req.user.id },
        { user: { department: req.user.department } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (date) {
      where.date = date;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { id: true, name: true, email: true, role: true, department: true } },
        checkIns: true,
        feedbacks: true
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ]
    });

    const formatted = bookings.map(b => ({
      ...b,
      requestedFacilities: JSON.parse(b.requestedFacilities || '[]')
    }));

    return res.json({ success: true, count: formatted.length, bookings: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.', error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        resource: { include: { building: true, type: true } },
        user: { select: { id: true, name: true, email: true, role: true, department: true } },
        approvals: { include: { approvedBy: { select: { name: true, role: true } } } },
        checkIns: true,
        feedbacks: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.json({
      success: true,
      booking: {
        ...booking,
        requestedFacilities: JSON.parse(booking.requestedFacilities || '[]')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch booking details.', error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Only creator or Admin can cancel
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    if (['CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a booking that is currently ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Notify
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Cancelled',
        message: `Booking ${booking.bookingCode} for ${booking.resource.name} has been cancelled.`,
        type: 'BOOKING_CANCELLED'
      }
    });

    return res.json({ success: true, message: 'Booking cancelled successfully.', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.', error: error.message });
  }
};

const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    await prisma.bookingApproval.create({
      data: {
        bookingId: id,
        approvedById: req.user.id,
        status: 'APPROVED',
        remarks: remarks || 'Approved by Administrator / Faculty Head'
      }
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Request Approved',
        message: `Your booking request for ${booking.resource.name} on ${booking.date} has been APPROVED!`,
        type: 'BOOKING_APPROVED'
      }
    });

    return res.json({ success: true, message: 'Booking approved successfully!', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to approve booking.', error: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { resource: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Booking request was declined by administrator.'
      }
    });

    await prisma.bookingApproval.create({
      data: {
        bookingId: id,
        approvedById: req.user.id,
        status: 'REJECTED',
        remarks: reason || 'Declined'
      }
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Request Declined',
        message: `Your booking request for ${booking.resource.name} was declined: ${reason || 'Capacity conflict'}`,
        type: 'BOOKING_REJECTED'
      }
    });

    return res.json({ success: true, message: 'Booking request rejected.', booking: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reject booking.', error: error.message });
  }
};

module.exports = {
  checkAvailability,
  recommendResources,
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  approveBooking,
  rejectBooking
};
