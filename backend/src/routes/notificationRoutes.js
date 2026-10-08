const express = require('express');
const { getUserNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

module.exports = router;
