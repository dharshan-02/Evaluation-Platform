const express = require('express');
const router = express.Router();
const { checkPlagiarism, getReport, getAssignmentReports, checkWebPlagiarism } = require('../controllers/plagiarismController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth, authorize('admin', 'faculty'));

router.post('/check/:assignmentId', checkPlagiarism);
router.post('/check-web/:submissionId', checkWebPlagiarism);
router.get('/report/:reportId', getReport);
router.get('/assignment/:assignmentId', getAssignmentReports);

module.exports = router;
