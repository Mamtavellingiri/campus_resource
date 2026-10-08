const express = require('express');
const {
  getAllUsers,
  createUser,
  getAllSubjects,
  updateUserRole,
  getAuditLogs,
  getSystemSettings,
  updateSystemSetting,
  getStudentEnrollments,
  assignStudentEnrollments
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/subjects', getAllSubjects);
router.get('/students/:id/enrollments', getStudentEnrollments);
router.post('/students/:id/enrollments', assignStudentEnrollments);
router.patch('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSetting);

module.exports = router;
