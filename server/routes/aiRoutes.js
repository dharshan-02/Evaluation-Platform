const express = require('express');
const router = express.Router();
const { reviewCode, chatWithTutor } = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.post('/review', auth, reviewCode);
router.post('/tutor', auth, chatWithTutor);

module.exports = router;
