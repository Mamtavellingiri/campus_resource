const prisma = require('../config/prisma');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getAll = async (req, res) => {
  try {
    const { type, building, status, search } = req.query;

    const where = {};
    if (type) where.type = type;
    if (building) where.building = building;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { roomNumber: { contains: search } }
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      count: resources.length,
      resources
    });

  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
exports.getOne = async (req, res) => {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    res.json({
      success: true,
      resource
    });

  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private (Admin only)
exports.create = async (req, res) => {
  try {
    const { name, roomNumber, type, capacity, building, floor, facilities, status, ecoScore, basePowerConsumptionKw } = req.body;

    if (!name || !roomNumber || !type || !capacity || !building) {
      return res.status(400).json({
        success: false,
        message: '❌ Name, room number, type, capacity, and building are required'
      });
    }

    const resource = await prisma.resource.create({
      data: {
        name,
        roomNumber,
        type,
        capacity: parseInt(capacity),
        building,
        floor: floor ? parseInt(floor) : null,
        facilities: facilities || '',
        status: status || 'AVAILABLE',
        ecoScore: ecoScore ? parseInt(ecoScore) : null,
        basePowerConsumptionKw: basePowerConsumptionKw ? parseFloat(basePowerConsumptionKw) : null
      }
    });

    res.status(201).json({
      success: true,
      message: '✅ Resource created successfully!',
      resource
    });

  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (Admin only)
exports.update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, roomNumber, type, capacity, building, floor, facilities, status, ecoScore, basePowerConsumptionKw } = req.body;

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        name: name || existing.name,
        roomNumber: roomNumber || existing.roomNumber,
        type: type || existing.type,
        capacity: capacity ? parseInt(capacity) : existing.capacity,
        building: building || existing.building,
        floor: floor !== undefined ? parseInt(floor) : existing.floor,
        facilities: facilities !== undefined ? facilities : existing.facilities,
        status: status || existing.status,
        ecoScore: ecoScore !== undefined ? parseInt(ecoScore) : existing.ecoScore,
        basePowerConsumptionKw: basePowerConsumptionKw !== undefined ? parseFloat(basePowerConsumptionKw) : existing.basePowerConsumptionKw
      }
    });

    res.json({
      success: true,
      message: '✅ Resource updated successfully!',
      resource
    });

  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (Admin only)
exports.delete = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    await prisma.resource.delete({ where: { id } });

    res.json({
      success: true,
      message: '✅ Resource deleted successfully!'
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};