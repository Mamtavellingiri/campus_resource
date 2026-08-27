const express = require('express');
const {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  updateResourceStatus,
  getBuildingsAndTypes
} = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllResources);
router.get('/meta/categories', getBuildingsAndTypes);
router.get('/:id', getResourceById);

// Admin-only endpoints
router.post('/', authenticate, authorize(['ADMIN']), createResource);
router.put('/:id', authenticate, authorize(['ADMIN']), updateResource);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteResource);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'FACULTY']), updateResourceStatus);

module.exports = router;
