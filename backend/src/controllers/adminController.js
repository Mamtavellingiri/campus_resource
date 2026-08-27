const prisma = require('../config/prisma');

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        createdAt: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['STUDENT', 'FACULTY', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_USER_ROLE',
        entity: 'USER',
        entityId: id,
        details: `Updated role of ${updated.name} (${updated.email}) to ${role}`
      }
    });

    return res.json({ success: true, message: `User role updated to ${role}`, user: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.', error: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.', error: error.message });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    return res.json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system settings.', error: error.message });
  }
};

const updateSystemSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Setting key and value are required.' });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), description: 'Configured by Admin' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_SETTING',
        entity: 'SETTING',
        details: `Changed system setting ${key} = ${value}`
      }
    });

    return res.json({ success: true, message: `Setting ${key} updated successfully!`, setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update system setting.', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getAuditLogs,
  getSystemSettings,
  updateSystemSetting
};
