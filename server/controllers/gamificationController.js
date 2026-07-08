const User = require('../models/User');
const Challenge = require('../models/Challenge');

/**
 * @route   GET /api/gamification/leaderboard
 * @desc    Get top users ranked by points
 * @access  Private
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Only rank students
    const users = await User.find({ role: 'student', points: { $gt: 0 } })
      .sort({ points: -1 })
      .limit(limit)
      .select('name points badges currentStreak avatar department');

    res.json({
      success: true,
      leaderboard: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/gamification/activity
 * @desc    Log daily activity and update streaks
 * @access  Private
 */
const logActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = user.activityDates.length > 0 ? user.activityDates[user.activityDates.length - 1] : null;

    let streakUpdated = false;

    if (lastActivity !== today) {
      user.activityDates.push(today);
      
      // Calculate streak
      if (!lastActivity) {
        user.currentStreak = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayStr) {
          user.currentStreak += 1;
        } else {
          user.currentStreak = 1;
        }
      }
      
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
      
      // Badge logic: Early Bird / Streaks
      if (user.currentStreak === 7 && !user.badges.includes('Weekly Warrior')) {
        user.badges.push('Weekly Warrior');
      }
      if (user.currentStreak === 30 && !user.badges.includes('Monthly Master')) {
        user.badges.push('Monthly Master');
      }

      await user.save();
      streakUpdated = true;
    }

    res.json({
      success: true,
      streakUpdated,
      currentStreak: user.currentStreak,
      points: user.points,
      badges: user.badges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/gamification/challenges
 * @desc    Get all active playground challenges
 * @access  Private
 */
const getChallenges = async (req, res, next) => {
  try {
    const { language, level } = req.query;
    
    let filter = {};
    if (language) filter.language = language;
    if (level) filter.level = level;
    
    // Omit testCases expectedOutput from response to prevent cheating
    const challenges = await Challenge.find(filter)
      .select('-testCases.expectedOutput')
      .sort({ language: 1, levelNumber: 1 });
      
    let completedChallenges = [];
    if (req.user) {
      const user = await User.findById(req.user.id).select('completedChallenges');
      if (user) completedChallenges = user.completedChallenges;
    }
      
    res.json({
      success: true,
      challenges,
      completedChallenges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/gamification/challenges/:id
 * @desc    Get a single challenge by ID
 * @access  Private
 */
const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id).select('-testCases.expectedOutput');
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    res.json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  logActivity,
  getChallenges,
  getChallengeById
};
