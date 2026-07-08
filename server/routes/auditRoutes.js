const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

// Protect all audit routes and restrict to admin only
router.use(auth);
router.use(authorize('admin'));

router.get('/', getAuditLogs);

module.exports = router;
