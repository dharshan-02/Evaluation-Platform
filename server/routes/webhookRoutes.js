const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// GitHub Webhook listener
// This route does not use standard auth middleware because it's called by GitHub.
// We will use a secret token verification in the controller.
router.post('/github', webhookController.handleGitHubPush);

// Route for students to register their webhook secret
const auth = require('../middleware/auth');
router.post('/register', auth, webhookController.registerWebhook);

module.exports = router;
