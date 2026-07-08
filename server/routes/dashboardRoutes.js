const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

// Both Admin, Faculty, and Student share this endpoint, 
// and the controller returns different data depending on role
router.get('/stats', authorize('admin', 'faculty', 'student'), getDashboardStats);

module.exports = router;
