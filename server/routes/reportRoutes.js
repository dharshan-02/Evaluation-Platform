const express = require('express');
const router = express.Router();
const { getSubmissionReport, getPlagiarismReport } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

router.get('/submission/:id', getSubmissionReport);
router.get('/plagiarism/:id', authorize('admin', 'faculty'), getPlagiarismReport);

module.exports = router;
