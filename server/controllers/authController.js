const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const { logAction } = require('../services/auditService');

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, studentId } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Prevent registration as admin (must be created via seed or by another admin)
    const userRole = role === 'admin' ? 'student' : (role || 'student');

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      department,
      studentId: userRole === 'student' ? studentId : undefined,
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.userId = user._id; // Attach for audit log
    await logAction(req, 'USER_REGISTERED', `New user registered: ${user.email}`, { role: user.role, email: user.email }, user._id, 'User');

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user with password field included
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      await logAction(req, 'LOGIN_FAILED', `Failed login attempt for unknown email`, { attemptedEmail: email });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      req.userId = user._id;
      await logAction(req, 'LOGIN_FAILED_INACTIVE', `Failed login attempt for deactivated account`, { email: user.email }, user._id, 'User');
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Contact administrator.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      req.userId = user._id;
      await logAction(req, 'LOGIN_FAILED_PASSWORD', `Failed login attempt (wrong password)`, { email: user.email }, user._id, 'User');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.userId = user._id;
    await logAction(req, 'LOGIN_SUCCESS', `User logged in successfully`, { email: user.email, role: user.role }, user._id, 'User');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user's profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, department, studentId, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (studentId) updateData.studentId = studentId;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
