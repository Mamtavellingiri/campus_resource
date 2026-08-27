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

    const ticket = await prisma.maintenance.create({
      data: {
        resourceId,
        issue,
        description,
        priority,
        assignedStaff: assignedStaff || 'Facility Maintenance Team',
        expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : null,
        status: 'IN_PROGRESS'
      },
      include: { resource: true }
    });

    // Mark resource as MAINTENANCE status so it CANNOT be booked!
    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        status: 'MAINTENANCE',
        maintenanceStatus: 'UNDER_REPAIR'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_MAINTENANCE',
        entity: 'RESOURCE',
        entityId: resourceId,
        details: `Created maintenance ticket: ${issue} for resource ${ticket.resource.name}`
      }
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance ticket reported. ${ticket.resource.name} is now locked under MAINTENANCE status.`,
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

    // If completed, release resource back to AVAILABLE
    if (status === 'COMPLETED') {
      await prisma.resource.update({
        where: { id: updated.resourceId },
        data: {
          status: 'AVAILABLE',
          maintenanceStatus: 'NONE'
        }
      });
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
