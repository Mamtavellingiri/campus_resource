const prisma = require('../config/prisma');

const processCheckIn = async (req, res) => {
  try {
    const { bookingId, qrPayload } = req.body;
    let targetBookingId = bookingId;

    if (qrPayload) {
      try {
        const parsed = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        if (parsed.bookingCode) {
          const found = await prisma.booking.findUnique({ where: { bookingCode: parsed.bookingCode } });
          if (found) targetBookingId = found.id;
        }
      } catch (e) {
        // payload might be plain bookingCode string
        const found = await prisma.booking.findUnique({ where: { bookingCode: qrPayload } });
        if (found) targetBookingId = found.id;
      }
    }

    if (!targetBookingId) {
      return res.status(400).json({ success: false, message: 'Valid bookingId or QR Payload required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: targetBookingId },
      include: { resource: true, user: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status === 'CHECKED_IN') {
      return res.status(400).json({ success: false, message: 'Already checked into this resource!' });
    }

    if (booking.status === 'CHECKED_OUT') {
      return res.status(400).json({ success: false, message: 'This booking has already been completed and checked out.' });
    }

    if (['REJECTED', 'CANCELLED', 'NO_SHOW'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot check in. Booking status is ${booking.status}` });
    }

    const now = new Date();

    // 1. Update Booking status to CHECKED_IN
    const updatedBooking = await prisma.booking.update({
      where: { id: targetBookingId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: now
      }
    });

    // 2. Resource status becomes BOOKED (Occupied)
    await prisma.resource.update({
      where: { id: booking.resourceId },
      data: { status: 'BOOKED' }
    });

    // 3. Create CheckIn record
    await prisma.checkIn.create({
      data: {
        bookingId: targetBookingId,
        userId: req.user.id,
        checkInTime: now,
        status: 'CHECKED_IN'
      }
    });

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'QR_CHECKIN',
        entity: 'BOOKING',
        entityId: targetBookingId,
        details: `User ${req.user.name} scanned QR code and checked into ${booking.resource.name}`
      }
    });

    return res.json({
      success: true,
      message: `🎉 Successfully checked into ${booking.resource.name}! Status updated to CHECKED_IN.`,
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Check-in failed.', error: error.message });
  }
};

const processCheckOut = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required for check-out.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { resource: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'CHECKED_IN') {
      return res.status(400).json({ success: false, message: `Cannot check out. Booking status is ${booking.status}` });
    }

    const now = new Date();

    // 1. Update Booking status to CHECKED_OUT
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CHECKED_OUT',
        checkedOutAt: now
      }
    });

    // 2. Release Resource back to AVAILABLE
    await prisma.resource.update({
      where: { id: booking.resourceId },
      data: { status: 'AVAILABLE' }
    });

    // 3. Update CheckIn record
    const activeCheckIn = await prisma.checkIn.findFirst({
      where: { bookingId, status: 'CHECKED_IN' },
      orderBy: { checkInTime: 'desc' }
    });

    if (activeCheckIn) {
      await prisma.checkIn.update({
        where: { id: activeCheckIn.id },
        data: {
          status: 'CHECKED_OUT',
          checkOutTime: now
        }
      });
    }

    // 4. Send notification requesting post-use feedback
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        title: 'Check-Out Complete - Give Feedback',
        message: `Hope your session at ${booking.resource.name} went great! Please leave your feedback & rating.`,
        type: 'INFO'
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CHECKOUT',
        entity: 'BOOKING',
        entityId: bookingId,
        details: `Checked out of ${booking.resource.name}`
      }
    });

    return res.json({
      success: true,
      message: `Checked out of ${booking.resource.name}. Resource is now AVAILABLE for others.`,
      booking: updatedBooking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Check-out failed.', error: error.message });
  }
};

module.exports = { processCheckIn, processCheckOut };
