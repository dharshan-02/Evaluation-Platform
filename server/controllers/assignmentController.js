const Assignment = require('../models/Assignment');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const { getIO } = require('../socket');
const { logAction } = require('../services/auditService');

/**
 * @route   GET /api/assignments
 * @desc    List assignments (filtered by role)
 * @access  Private
 */
const getAssignments = async (req, res, next) => {
  try {
    const { status, course, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Students only see published/active assignments
    if (req.user.role === 'student') {
      filter.isPublished = true;
      filter.status = { $in: ['active', 'closed'] };
    }

    // Faculty see only their own assignments
    if (req.user.role === 'faculty') {
      filter.createdBy = req.user.id;
    }

    if (status) filter.status = status;
    if (course) filter.course = new RegExp(course, 'i');
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { course: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Assignment.countDocuments(filter),
    ]);

    // Get test case and submission counts (and student status) for each assignment
    const assignmentsWithCounts = await Promise.all(
      assignments.map(async (a) => {
        const [testCaseCount, submissionCount] = await Promise.all([
          TestCase.countDocuments({ assignment: a._id }),
          Submission.countDocuments({ assignment: a._id }),
        ]);
        
        let studentSubmission = null;
        if (req.user.role === 'student') {
          studentSubmission = await Submission.findOne({
            assignment: a._id,
            student: req.user.id
          }).select('status marks');
        }

        return {
          ...a.toObject(),
          testCaseCount,
          submissionCount,
          studentSubmission, // Will contain { status, marks } or null
        };
      })
    );

    res.json({
      success: true,
      assignments: assignmentsWithCounts,
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
 * @route   GET /api/assignments/:id
 * @desc    Get a single assignment with test cases
 * @access  Private
 */
const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Students can't see unpublished assignments
    if (req.user.role === 'student' && !assignment.isPublished) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Get test cases (hide hidden ones from students)
    let testCaseFilter = { assignment: assignment._id };
    if (req.user.role === 'student') {
      testCaseFilter.isHidden = false;
    }
    const testCases = await TestCase.find(testCaseFilter).sort({ order: 1 });

    // Get submission count
    const submissionCount = await Submission.countDocuments({ assignment: assignment._id });

    // Check if current student has submitted
    let userSubmission = null;
    if (req.user.role === 'student') {
      userSubmission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user.id,
      });
    }

    res.json({
      success: true,
      assignment: {
        ...assignment.toObject(),
        testCases,
        submissionCount,
        userSubmission,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment
 * @access  Faculty, Admin
 */
const createAssignment = async (req, res, next) => {
  try {
    const assignmentData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const assignment = await Assignment.create(assignmentData);

    try {
      getIO().emit('dashboard:update');
    } catch (e) {}

    await logAction(req, 'ASSIGNMENT_CREATED', `Created assignment: ${assignment.title}`, { title: assignment.title, course: assignment.course }, assignment._id, 'Assignment');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update an assignment
 * @access  Faculty (owner), Admin
 */
const updateAssignment = async (req, res, next) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Only owner or admin can update
    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment.' });
    }

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    try {
      getIO().emit('dashboard:update');
    } catch (e) {}

    await logAction(req, 'ASSIGNMENT_UPDATED', `Updated assignment: ${assignment.title}`, { fieldsUpdated: Object.keys(req.body) }, assignment._id, 'Assignment');

    res.json({
      success: true,
      message: 'Assignment updated successfully.',
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete an assignment and its test cases
 * @access  Faculty (owner), Admin
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Only owner or admin can delete
    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this assignment.' });
    }

    // Delete associated test cases
    await TestCase.deleteMany({ assignment: assignment._id });

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Assignment and associated test cases deleted.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/assignments/:id/test-cases
 * @desc    Add a test case to an assignment
 * @access  Faculty (owner), Admin
 */
const addTestCase = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Get next order number
    const lastTestCase = await TestCase.findOne({ assignment: assignment._id }).sort({ order: -1 });
    const nextOrder = lastTestCase ? lastTestCase.order + 1 : 1;

    const testCase = await TestCase.create({
      ...req.body,
      assignment: assignment._id,
      order: req.body.order || nextOrder,
    });

    res.status(201).json({
      success: true,
      message: 'Test case added.',
      testCase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/assignments/:id/test-cases/:tcId
 * @desc    Update a test case
 * @access  Faculty (owner), Admin
 */
const updateTestCase = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const testCase = await TestCase.findOneAndUpdate(
      { _id: req.params.tcId, assignment: assignment._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found.' });
    }

    res.json({ success: true, message: 'Test case updated.', testCase });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/assignments/:id/test-cases/:tcId
 * @desc    Delete a test case
 * @access  Faculty (owner), Admin
 */
const deleteTestCase = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (req.user.role !== 'admin' && assignment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const testCase = await TestCase.findOneAndDelete({
      _id: req.params.tcId,
      assignment: assignment._id,
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: 'Test case not found.' });
    }

    res.json({ success: true, message: 'Test case deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  addTestCase,
  updateTestCase,
  deleteTestCase,
};
