const express = require('express');
const router = express.Router();
const { executeSubmission, getExecutionResults, executeCodePlayground, executePublicTestCases } = require('../controllers/executionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

router.post('/run-public', authorize('admin', 'faculty', 'student'), executePublicTestCases);
router.post('/test/playground', executeCodePlayground);

router.post('/:submissionId', authorize('admin', 'faculty', 'student'), executeSubmission);
router.get('/:submissionId/results', getExecutionResults);

module.exports = router;
