const prisma = require('../config/prisma');
const { getOccupiedResourceIds } = require('../services/occupancyService');
const { getNowInTz } = require('../utils/time');

// "In use right now" is NOT a resource status - it is derived from bookings (see occupancyService).
const VALID_RESOURCE_STATUSES = ['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE'];

const getAllResources = async (req, res) => {
  try {
    const {
      search,
      buildingId,
      typeCategory,
      minCapacity,
      status,
      minEcoScore
    } = req.query;

    const where = {
      isArchived: false  // never show archived resources by default
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { roomNumber: { contains: search } }
      ];
    }

    if (buildingId) {
      where.buildingId = buildingId;
    }

    if (typeCategory) {
      where.type = { category: typeCategory };
    }

    if (minCapacity) {
      where.capacity = { gte: parseInt(minCapacity, 10) };
    }

    if (status) {
      where.status = status;
    }

    if (minEcoScore) {
      where.ecoScore = { gte: parseInt(minEcoScore, 10) };
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        type: true,
        building: true,
        maintenances: {
          where: { status: { in: ['REPORTED', 'IN_PROGRESS'] } }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Which resources are being used right now (derived from bookings)
    const occupiedIds = await getOccupiedResourceIds();

    // Parse JSON string fields for client consumption
    const formatted = resources.map(r => ({
      ...r,
      inUseNow: occupiedIds.has(r.id),
      facilities: JSON.parse(r.facilities || '[]'),
      availableEquipment: JSON.parse(r.availableEquipment || '[]'),
      images: JSON.parse(r.images || '[]')
    }));

    return res.json({ success: true, count: formatted.length, resources: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resources.', error: error.message });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        type: true,
        building: true,
        bookings: {
          where: { status: { in: ['APPROVED', 'CHECKED_IN'] } },
          take: 10,
          orderBy: { date: 'asc' }
        },
        maintenances: true,
        feedbacks: {
          include: { user: { select: { name: true, role: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const formatted = {
      ...resource,
      facilities: JSON.parse(resource.facilities || '[]'),
      availableEquipment: JSON.parse(resource.availableEquipment || '[]'),
      images: JSON.parse(resource.images || '[]')
    };

    return res.json({ success: true, resource: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resource details.', error: error.message });
  }
};

const createResource = async (req, res) => {
  try {
    const {
      name,
      typeId,
      buildingId,
      floor = 1,
      roomNumber,
      capacity,
      description,
      facilities = [],
      availableEquipment = [],
      images = [],
      operatingHoursStart = '08:00',
      operatingHoursEnd = '20:00',
      energyEfficiencyRating = 85,
      ecoScore = 85,
      basePowerConsumptionKw = 2.0,
      hourlyCost = 0.0
    } = req.body;

    if (!name || !typeId || !buildingId || !roomNumber || !capacity) {
      return res.status(400).json({ success: false, message: 'Missing required resource fields.' });
    }

    const newResource = await prisma.resource.create({
      data: {
        name,
        typeId,
        buildingId,
        floor: parseInt(floor, 10),
        roomNumber,
        capacity: parseInt(capacity, 10),
        description,
        facilities: JSON.stringify(facilities),
        availableEquipment: JSON.stringify(availableEquipment),
        images: JSON.stringify(images),
        operatingHoursStart,
        operatingHoursEnd,
        energyEfficiencyRating: parseInt(energyEfficiencyRating, 10),
        ecoScore: parseInt(ecoScore, 10),
        basePowerConsumptionKw: parseFloat(basePowerConsumptionKw),
        hourlyCost: parseFloat(hourlyCost),
        status: 'AVAILABLE'
      },
      include: { type: true, building: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_RESOURCE',
        entity: 'RESOURCE',
        entityId: newResource.id,
        details: `Admin ${req.user.name} created resource ${newResource.name}`
      }
    });

    const facultyUsers = await prisma.user.findMany({
      where: { role: 'FACULTY' },
      select: { id: true }
    });
    for (const faculty of facultyUsers) {
      await prisma.notification.create({
        data: {
          userId: faculty.id,
          title: 'New Campus Resource Available',
          message: `${newResource.name} (${newResource.capacity} seats) has been added and is available to book.`,
          type: 'RESOURCE_ADDED'
        }
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully!',
      resource: {
        ...newResource,
        facilities: JSON.parse(newResource.facilities),
        availableEquipment: JSON.parse(newResource.availableEquipment),
        images: JSON.parse(newResource.images)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create resource.', error: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      typeId,
      buildingId,
      floor,
      roomNumber,
      capacity,
      description,
      facilities,
      availableEquipment,
      images,
      operatingHoursStart,
      operatingHoursEnd,
      status,
      energyEfficiencyRating,
      ecoScore,
      basePowerConsumptionKw
    } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (typeId !== undefined) data.typeId = typeId;
    if (buildingId !== undefined) data.buildingId = buildingId;
    if (floor !== undefined) data.floor = parseInt(floor, 10);
    if (roomNumber !== undefined) data.roomNumber = roomNumber;
    if (capacity !== undefined) data.capacity = parseInt(capacity, 10);
    if (description !== undefined) data.description = description;
    if (facilities !== undefined) data.facilities = JSON.stringify(facilities);
    if (availableEquipment !== undefined) data.availableEquipment = JSON.stringify(availableEquipment);
    if (images !== undefined) data.images = JSON.stringify(images);
    if (operatingHoursStart !== undefined) data.operatingHoursStart = operatingHoursStart;
    if (operatingHoursEnd !== undefined) data.operatingHoursEnd = operatingHoursEnd;
    if (status !== undefined) {
      if (!VALID_RESOURCE_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid resource status value.' });
      }
      data.status = status;
    }
    if (energyEfficiencyRating !== undefined) data.energyEfficiencyRating = parseInt(energyEfficiencyRating, 10);
    if (ecoScore !== undefined) data.ecoScore = parseInt(ecoScore, 10);
    if (basePowerConsumptionKw !== undefined) data.basePowerConsumptionKw = parseFloat(basePowerConsumptionKw);

    const updated = await prisma.resource.update({
      where: { id },
      data,
      include: { type: true, building: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_RESOURCE',
        entity: 'RESOURCE',
        entityId: updated.id,
        details: `Updated resource ${updated.name}`
      }
    });

    return res.json({
      success: true,
      message: 'Resource updated successfully!',
      resource: {
        ...updated,
        facilities: JSON.parse(updated.facilities || '[]'),
        availableEquipment: JSON.parse(updated.availableEquipment || '[]'),
        images: JSON.parse(updated.images || '[]')
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update resource.', error: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // "Today" in the configured timezone (TIMEZONE env, default Asia/Kolkata)
    const todayStr = getNowInTz().date;

    // Cancel all future APPROVED or PENDING bookings for this resource
    const futureBookings = await prisma.booking.findMany({
      where: {
        resourceId: id,
        status: { in: ['APPROVED', 'PENDING'] },
        date: { gte: todayStr }
      },
      include: { user: true }
    });

    await prisma.$transaction(async (tx) => {
      // Soft-delete the resource
      await tx.resource.update({
        where: { id },
        data: { isArchived: true }
      });

      // Cancel future bookings and notify users
      for (const booking of futureBookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            rejectionReason: 'Resource has been removed from service.'
          }
        });
        await tx.notification.create({
          data: {
            userId: booking.userId,
            title: 'Booking Cancelled - Resource Removed',
            message: `Your booking ${booking.bookingCode} on ${booking.date} for ${resource.name} has been cancelled because the resource was removed from service.`,
            type: 'BOOKING_CANCELLED'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ARCHIVE_RESOURCE',
          entity: 'RESOURCE',
          entityId: id,
          details: `Archived resource ${resource.name}. Cancelled ${futureBookings.length} future booking(s).`
        }
      });
    });

    return res.json({
      success: true,
      message: `Resource archived. ${futureBookings.length} future booking(s) cancelled and users notified.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to archive resource.', error: error.message });
  }
};

const restoreResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    await prisma.resource.update({ where: { id }, data: { isArchived: false } });
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RESTORE_RESOURCE',
        entity: 'RESOURCE',
        entityId: id,
        details: `Restored archived resource ${resource.name}`
      }
    });
    return res.json({ success: true, message: 'Resource restored successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to restore resource.', error: error.message });
  }
};

const getArchivedResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      where: { isArchived: true },
      include: { type: true, building: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, count: resources.length, resources });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch archived resources.', error: error.message });
  }
};

const updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, maintenanceStatus } = req.body;

    if (!VALID_RESOURCE_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid resource status value.' });
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        status,
        maintenanceStatus: maintenanceStatus || (status === 'MAINTENANCE' ? 'UNDER_REPAIR' : 'NONE')
      }
    });

    return res.json({ success: true, message: `Resource status changed to ${status}`, resource: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status.', error: error.message });
  }
};

const getBuildingsAndTypes = async (req, res) => {
  try {
    const buildings = await prisma.building.findMany({ orderBy: { name: 'asc' } });
    const types = await prisma.resourceType.findMany({ orderBy: { name: 'asc' } });
    return res.json({ success: true, buildings, types });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories/buildings.', error: error.message });
  }
};

module.exports = {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  restoreResource,
  getArchivedResources,
  updateResourceStatus,
  getBuildingsAndTypes
};
