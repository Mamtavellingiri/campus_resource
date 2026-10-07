const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', resourceController.getAll);
router.get('/:id', resourceController.getOne);
router.post('/', authMiddleware, resourceController.create);
router.put('/:id', authMiddleware, resourceController.update);
router.delete('/:id', authMiddleware, resourceController.delete);

module.exports = router;