const prisma = require('../config/prisma');

const getMaintenanceTickets = async (req, res) => {
  try {
    const { status, resourceId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (resourceId) where.resourceId = resourceId;

    const tickets = await prisma.maintenance.findMany({
      where,
      include: {
        resource: { include: { building: true, type: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch maintenance records.', error: error.message });
  }
};

const createMaintenanceTicket = async (req, res) => {
  try {
    const {
      resourceId,
      issue,
      description,
      priority = 'MEDIUM',
      assignedStaff,
      expectedCompletion
    } = req.body;

    if (!resourceId || !issue) {
      return res.status(400).json({ success: false, message: 'resourceId and issue title are required.' });
    }

    const config = require('../config/env');
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: config.TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const expectedCompletionDate = expectedCompletion ? new Date(expectedCompletion) : null;

    // Find APPROVED/PENDING future bookings that overlap with this maintenance window
    const affectedBookings = await prisma.booking.findMany({
      where: {
        resourceId,
        status: { in: ['APPROVED', 'PENDING'] },
        date: { gte: todayStr }
      },
      include: { user: true }
    });

    let ticket;
    await prisma.$transaction(async (tx) => {
      ticket = await tx.maintenance.create({
        data: {
          resourceId,
          issue,
          description,
          priority,
          assignedStaff: assignedStaff || 'Facility Maintenance Team',
          expectedCompletion: expectedCompletionDate,
          status: 'IN_PROGRESS'
        },
        include: { resource: true }
      });

      // Mark resource as MAINTENANCE
      await tx.resource.update({
        where: { id: resourceId },
        data: { status: 'MAINTENANCE', maintenanceStatus: 'UNDER_REPAIR' }
      });

      // Cancel affected bookings and notify users
      for (const booking of affectedBookings) {
        // Only cancel if the booking falls within maintenance window (if no end date, cancel all future)
        const isAffected = !expectedCompletionDate || booking.date <= expectedCompletionDate.toISOString().split('T')[0];
        if (!isAffected) continue;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            rejectionReason: `Resource under maintenance: ${issue}. Expected completion: ${expectedCompletion || 'TBD'}.`
          }
        });

        await tx.notification.create({
          data: {
            userId: booking.userId,
            title: 'Booking Cancelled - Maintenance Scheduled',
            message: `Your booking ${booking.bookingCode} for ${ticket.resource.name} on ${booking.date} has been cancelled due to maintenance: ${issue}.`,
            type: 'BOOKING_CANCELLED'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE_MAINTENANCE',
          entity: 'RESOURCE',
          entityId: resourceId,
          details: `Created maintenance ticket: ${issue} for ${ticket.resource.name}. Cancelled ${affectedBookings.length} booking(s).`
        }
      });
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance ticket created. ${ticket.resource.name} is now MAINTENANCE. ${affectedBookings.length} booking(s) cancelled.`,
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create maintenance ticket.', error: error.message });
  }
};

const updateMaintenanceTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedStaff, expectedCompletion, priority } = req.body;

    const data = {};
    if (status) data.status = status;
    if (assignedStaff) data.assignedStaff = assignedStaff;
    if (expectedCompletion) data.expectedCompletion = new Date(expectedCompletion);
    if (priority) data.priority = priority;

    const updated = await prisma.maintenance.update({
      where: { id },
      data,
      include: { resource: true }
    });

    // If completed or cancelled, check if other open tickets still exist before releasing resource
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      const openTickets = await prisma.maintenance.count({
        where: {
          resourceId: updated.resourceId,
          status: { in: ['REPORTED', 'IN_PROGRESS'] },
          id: { not: id } // exclude current ticket
        }
      });

      if (openTickets === 0) {
        await prisma.resource.update({
          where: { id: updated.resourceId },
          data: { status: 'AVAILABLE', maintenanceStatus: 'NONE' }
        });
      }
    }

    return res.json({
      success: true,
      message: `Maintenance ticket updated to ${status}.`,
      ticket: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update maintenance ticket.', error: error.message });
  }
};

module.exports = {
  getMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket
};
