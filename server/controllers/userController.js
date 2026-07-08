const User = require('../models/User');
const { logAction } = require('../services/auditService');

/**
 * @route   GET /api/users
 * @desc    List all users (with filtering)
 * @access  Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = new RegExp(department, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user
 * @access  Admin
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user (admin can change role, activate/deactivate)
 * @access  Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, role, department, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await logAction(req, 'USER_UPDATED', `Updated user: ${user.email}`, { updateData }, user._id, 'User');

    res.json({
      success: true,
      message: 'User updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate a user (soft delete)
 * @access  Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await logAction(req, 'USER_DEACTIVATED', `Deactivated user: ${user.email}`, { email: user.email }, user._id, 'User');

    res.json({
      success: true,
      message: 'User deactivated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users
 * @desc    Create a user (Admin only)
 * @access  Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, studentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const userData = { name, email, password, role };
    if (department) userData.department = department;
    if (role === 'student' && studentId) userData.studentId = studentId;

    const user = await User.create(userData);

    await logAction(req, 'USER_CREATED', `Admin created user: ${user.email}`, { role: user.role, email: user.email }, user._id, 'User');

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
