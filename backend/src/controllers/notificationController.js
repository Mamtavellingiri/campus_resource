const prisma = require('../config/prisma');

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    return res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found.' });
    
    if (notif.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.', error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications.', error: error.message });
  }
};

module.exports = { getUserNotifications, markAsRead, markAllAsRead };
