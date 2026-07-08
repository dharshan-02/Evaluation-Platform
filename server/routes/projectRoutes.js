const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');
const projectController = require('../controllers/projectController');

// All project routes require authentication
router.use(auth);

// Students create projects
router.post('/', authorize('student'), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectDetails);

// Faculty add reviews to a project
router.post('/:id/reviews', authorize('admin', 'faculty'), projectController.addReviewToProject);

// Document upload uses multiple fields (e.g., reportFile, presentationFile)
const cpUpload = upload.fields([
  { name: 'reportFile', maxCount: 1 },
  { name: 'presentationFile', maxCount: 1 }
]);
router.post('/:id/reviews/:reviewId/submit', cpUpload, projectController.submitReviewDocuments);

router.post('/:id/reviews/:reviewId/grade', authorize('admin', 'faculty'), projectController.gradeReview);

module.exports = router;
