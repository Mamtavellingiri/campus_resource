const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, feedbackController.create);
router.get('/', authMiddleware, feedbackController.getAll);
router.get('/resource/:resourceId', authMiddleware, feedbackController.getByResource);

module.exports = router;