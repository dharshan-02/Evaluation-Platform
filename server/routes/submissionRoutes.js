const express = require('express');
const router = express.Router();
const { createSubmission, getSubmissions, getSubmission, gradeProjectSubmission } = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');

router.use(auth);

router.get('/', getSubmissions);
router.get('/:id', getSubmission);
router.post('/', authorize('student'), upload.single('file'), createSubmission);
router.post('/:id/grade', authorize('admin', 'faculty'), gradeProjectSubmission);

module.exports = router;
