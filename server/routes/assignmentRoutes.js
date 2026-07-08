const express = require('express');
const router = express.Router();
const {
  getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment,
  addTestCase, updateTestCase, deleteTestCase,
} = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', authorize('admin', 'faculty'), createAssignment);
router.put('/:id', authorize('admin', 'faculty'), updateAssignment);
router.delete('/:id', authorize('admin', 'faculty'), deleteAssignment);

// Test case routes
router.post('/:id/test-cases', authorize('admin', 'faculty'), addTestCase);
router.put('/:id/test-cases/:tcId', authorize('admin', 'faculty'), updateTestCase);
router.delete('/:id/test-cases/:tcId', authorize('admin', 'faculty'), deleteTestCase);

module.exports = router;
