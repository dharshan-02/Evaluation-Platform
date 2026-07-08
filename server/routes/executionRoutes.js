const express = require('express');
const router = express.Router();
const { executeSubmission, getExecutionResults, executeCodePlayground, executePublicTestCases, executeChallenge } = require('../controllers/executionController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.post('/test/playground', executeCodePlayground);

router.use(auth);

router.post('/run-public', authorize('admin', 'faculty', 'student'), executePublicTestCases);
router.post('/challenge/:id', executeChallenge);

router.post('/:submissionId', authorize('admin', 'faculty', 'student'), executeSubmission);
router.get('/:submissionId/results', getExecutionResults);

module.exports = router;
