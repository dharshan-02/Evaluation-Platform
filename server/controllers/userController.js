const User = require('../models/User');
const Submission = require('../models/Submission');
const Project = require('../models/Project');
const { logAction } = require('../services/auditService');
const PDFDocument = require('pdfkit');
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
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id/report
 * @desc    Generate PDF Certificate & Report for a student
 * @access  Admin, Faculty, or self
 */
const generateStudentReport = async (req, res, next) => {
  try {
    const studentId = req.params.id === 'me' ? req.user.id : req.params.id;

    // Verify access permissions
    if (req.user.role === 'student' && studentId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only download your own report.' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Fetch student's submissions and projects
    const submissions = await Submission.find({ student: studentId, status: 'evaluated' })
      .populate('assignment', 'title course maxMarks');
    const projects = await Project.find({ 'members.user': studentId })
      .populate('reviews.grading.gradedBy', 'name');

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.name.replace(/\s+/g, '_')}_Transcript.pdf"`);
    
    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#4f46e5').text('D\'s VIKA EVALUATION PLATFORM', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#334155').text('Official Student Transcript', { align: 'center' });
    doc.moveDown(2);

    // Student Info
    doc.fontSize(14).fillColor('#0f172a').text('Student Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#475569');
    doc.text(`Name: ${student.name}`);
    doc.text(`Student ID: ${student.studentId || 'N/A'}`);
    doc.text(`Department: ${student.department || 'N/A'}`);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // Assignments Section
    doc.fontSize(14).fillColor('#0f172a').text('Completed Assignments', { underline: true });
    doc.moveDown(0.5);
    if (submissions.length === 0) {
      doc.fontSize(11).fillColor('#94a3b8').text('No evaluated assignments found.', { italic: true });
    } else {
      let totalMarks = 0;
      let totalMaxMarks = 0;
      submissions.forEach((sub, i) => {
        const title = sub.assignment ? sub.assignment.title : 'Unknown Assignment';
        const course = sub.assignment ? sub.assignment.course : 'N/A';
        const scoreStr = `${sub.marks} / ${sub.maxMarks}`;
        totalMarks += sub.marks;
        totalMaxMarks += sub.maxMarks;

        doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(`${i + 1}. ${title} (${course})`);
        doc.font('Helvetica').fillColor('#64748b').text(`Score: ${scoreStr}  |  Language: ${sub.language}`);
        doc.moveDown(0.5);
      });
      
      const overallAvg = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#10b981').font('Helvetica-Bold').text(`Average Assignment Score: ${overallAvg}%`);
    }
    doc.moveDown(2);

    // Projects Section
    doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold').text('Capstone Projects', { underline: true });
    doc.moveDown(0.5);
    if (projects.length === 0) {
      doc.fontSize(11).fillColor('#94a3b8').font('Helvetica').text('No projects found.', { italic: true });
    } else {
      projects.forEach((proj, i) => {
        doc.fontSize(12).fillColor('#1e293b').font('Helvetica-Bold').text(`Project: ${proj.title}`);
        doc.font('Helvetica').fillColor('#64748b').text(`Status: ${proj.status.toUpperCase()}`);
        doc.moveDown(0.5);
        
        proj.reviews.forEach(review => {
          if (review.status === 'graded' && review.grading) {
            doc.fontSize(11).fillColor('#334155').font('Helvetica-Oblique').text(`Review: ${review.name} - Score: ${review.grading.marks}/${review.maxMarks}`);
            doc.fontSize(10).fillColor('#64748b').text(`Feedback: "${review.grading.feedback || 'None'}"`);
            doc.moveDown(0.5);
          }
        });
        doc.moveDown(1);
      });
    }

    // Footer
    doc.moveDown(4);
    doc.fontSize(10).fillColor('#94a3b8').text('This is an automatically generated document.', { align: 'center' });

    // Finalize the PDF and end the stream
    doc.end();

    await logAction(req, 'REPORT_GENERATED', `Generated PDF transcript for student: ${student.email}`, null, student._id, 'User');
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
  generateStudentReport,
};
