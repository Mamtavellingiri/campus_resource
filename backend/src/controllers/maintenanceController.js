const prisma = require('../config/prisma');

// @desc    Lock resource for maintenance
// @route   POST /api/maintenance/lock
// @access  Private (Admin only)
exports.lockResource = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const { resourceId, reason } = req.body;

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: '❌ Resource ID is required'
      });
    }

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
        message: '❌ Resource is already under maintenance'
      });
    }

    const updated = await prisma.resource.update({
      where: { id: parseInt(resourceId) },
      data: {
        status: 'MAINTENANCE'
      }
    });

    // Create maintenance log entry
    await prisma.maintenanceLog.create({
      data: {
        resourceId: parseInt(resourceId),
        userId: req.user.id,
        reason: reason || 'Scheduled maintenance',
        startTime: new Date()
      }
    });

    res.json({
      success: true,
      message: '🔧 Resource locked for maintenance',
      resource: updated
    });

  } catch (error) {
    console.error('Lock resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Unlock resource from maintenance
// @route   POST /api/maintenance/unlock
// @access  Private (Admin only)
exports.unlockResource = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const { resourceId } = req.body;

    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: '❌ Resource ID is required'
      });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: parseInt(resourceId) }
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '❌ Resource not found'
      });
    }

    if (resource.status !== 'MAINTENANCE') {
      return res.status(400).json({
        success: false,
        message: '❌ Resource is not under maintenance'
      });
    }

    const updated = await prisma.resource.update({
      where: { id: parseInt(resourceId) },
      data: {
        status: 'AVAILABLE'
      }
    });

    // Update maintenance log with end time
    await prisma.maintenanceLog.updateMany({
      where: {
        resourceId: parseInt(resourceId),
        endTime: null
      },
      data: {
        endTime: new Date()
      }
    });

    res.json({
      success: true,
      message: '✅ Resource unlocked from maintenance',
      resource: updated
    });

  } catch (error) {
    console.error('Unlock resource error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};

// @desc    Get all maintenance logs
// @route   GET /api/maintenance
// @access  Private (Admin only)
exports.getAll = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '❌ Admin access required'
      });
    }

    const logs = await prisma.maintenanceLog.findMany({
      include: {
        resource: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json({
      success: true,
      count: logs.length,
      logs
    });

  } catch (error) {
    console.error('Get maintenance logs error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Server error'
    });
  }
};