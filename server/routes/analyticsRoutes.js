const express = require('express');
const router = express.Router();
const { getOverview, getAssignmentAnalytics } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth, authorize('admin', 'faculty'));

router.get('/overview', getOverview);
router.get('/assignment/:id', getAssignmentAnalytics);

module.exports = router;
