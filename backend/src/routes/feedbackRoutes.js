const express = require('express');
const { submitFeedback, getAllFeedback } = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', submitFeedback);
router.get('/', authorize(['ADMIN', 'FACULTY']), getAllFeedback);

module.exports = router;
