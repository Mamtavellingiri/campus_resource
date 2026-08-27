const express = require('express');
const {
  getAllUsers,
  updateUserRole,
  getAuditLogs,
  getSystemSettings,
  updateSystemSetting
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);

module.exports = router;
