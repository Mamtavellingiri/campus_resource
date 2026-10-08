const express = require('express');
const { joinWaitlist, getMyWaitlist, cancelWaitlistEntry } = require('../controllers/waitlistController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/', joinWaitlist);
router.get('/mine', getMyWaitlist);
router.delete('/:id', cancelWaitlistEntry);

module.exports = router;
