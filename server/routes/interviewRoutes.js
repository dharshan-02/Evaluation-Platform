const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getInterviewsByAssignment,
  createInterviewSlots,
  bookInterview,
  cancelInterview,
} = require('../controllers/interviewController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

// When mounted on /api/assignments/:assignmentId/interviews
router.route('/')
  .get(getInterviewsByAssignment)
  .post(authorize('admin', 'faculty'), createInterviewSlots);

// When mounted on /api/interviews/:id
router.post('/:id/book', authorize('student'), bookInterview);
router.post('/:id/cancel', cancelInterview);

module.exports = router;
