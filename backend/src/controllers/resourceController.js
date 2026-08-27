const prisma = require('../config/prisma');

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

    const where = {};

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

    // Parse JSON string fields for client consumption
    const formatted = resources.map(r => ({
      ...r,
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
    if (status !== undefined) data.status = status;
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

    await prisma.resource.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'DELETE_RESOURCE',
        entity: 'RESOURCE',
        entityId: id,
        details: `Deleted resource ${resource.name}`
      }
    });

    return res.json({ success: true, message: 'Resource deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete resource.', error: error.message });
  }
};

const updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, maintenanceStatus } = req.body;

    if (!['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'OUT_OF_SERVICE'].includes(status)) {
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
  updateResourceStatus,
  getBuildingsAndTypes
};
