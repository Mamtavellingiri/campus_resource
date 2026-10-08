const express = require('express');
const {
  getMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket
} = require('../controllers/maintenanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getMaintenanceTickets);
router.post('/', authorize(['ADMIN']), createMaintenanceTicket);
router.patch('/:id', authorize(['ADMIN']), updateMaintenanceTicket);

module.exports = router;
