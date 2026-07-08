const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

/**
 * Auth Routes
 *
 * POST   /api/auth/register  — Register new user (public)
 * POST   /api/auth/login     — Login user (public)
 * GET    /api/auth/me        — Get current user (private)
 * PUT    /api/auth/profile   — Update profile (private)
 */
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
