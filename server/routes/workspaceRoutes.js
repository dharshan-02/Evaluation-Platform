const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const workspaceController = require('../controllers/workspaceController');

router.post('/save', auth, workspaceController.saveWorkspace);
router.get('/saved', auth, workspaceController.getSavedWorkspaces);

module.exports = router;
