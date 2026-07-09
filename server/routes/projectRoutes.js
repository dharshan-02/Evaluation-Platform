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
// Global plagiarism report route
router.get('/plagiarism/all-reports', authorize('admin', 'faculty'), projectController.getAllDocumentPlagiarismReports);

router.get('/:id', projectController.getProjectDetails);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Faculty add reviews to a project
router.post('/:id/reviews', authorize('admin', 'faculty'), projectController.addReviewToProject);
router.put('/:id/reviews/:reviewId', authorize('admin', 'faculty'), projectController.updateReview);
router.delete('/:id/reviews/:reviewId', authorize('admin', 'faculty'), projectController.deleteReview);

// Document upload uses multiple fields (e.g., reportFile, presentationFile)
const cpUpload = upload.fields([
  { name: 'reportFile', maxCount: 1 },
  { name: 'presentationFile', maxCount: 1 }
]);
router.post('/:id/reviews/:reviewId/submit', cpUpload, projectController.submitReviewDocuments);

router.post('/:id/reviews/:reviewId/grade', authorize('admin', 'faculty'), projectController.gradeReview);

// Document Plagiarism Check Routes
router.post('/:id/reviews/:reviewId/plagiarism-scan', authorize('admin', 'faculty'), projectController.scanDocumentPlagiarism);
router.get('/:id/reviews/:reviewId/plagiarism-report', authorize('admin', 'faculty'), projectController.getDocumentPlagiarismReport);

module.exports = router;
