const express = require('express');
const router = express.Router();
const { getLeaderboard, logActivity, getChallenges, getChallengeById } = require('../controllers/gamificationController');
const auth = require('../middleware/auth');

// All gamification routes require authentication
router.use(auth);

router.get('/leaderboard', getLeaderboard);
router.post('/activity', logActivity);
router.get('/challenges', getChallenges);
router.get('/challenges/:id', getChallengeById);

module.exports = router;
