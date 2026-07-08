const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const { getIO } = require('../socket');

/**
 * @route   POST /api/submissions
 * @desc    Submit a project (ZIP upload or GitHub URL)
 * @access  Student
 */
const createSubmission = async (req, res, next) => {
  try {
    const { assignmentId, language, githubUrl } = req.body;

    // Validate assignment exists and is active
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    if (assignment.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This assignment is not accepting submissions.' });
    }

    // Check due date (allow until end of the due date day to prevent premature timezone closure)
    const deadline = new Date(assignment.dueDate);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline) {
      return res.status(400).json({ success: false, message: 'Submission deadline has passed.' });
    }

    // Validate language if it's a coding challenge
    if (assignment.type === 'code' && !assignment.allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Language "${language}" is not allowed. Allowed: ${assignment.allowedLanguages.join(', ')}`,
      });
    }

    // Check for existing submission (update if exists)
    let submission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id,
    });

    const files = [];

    // Handle ZIP file upload
    if (req.file) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'submissions', req.user.id.toString(), assignmentId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Extract ZIP
      try {
        const zip = new AdmZip(req.file.path);
        const entries = zip.getEntries();

        for (const entry of entries) {
          if (!entry.isDirectory) {
            const extractPath = path.join(uploadDir, entry.entryName);
            const dir = path.dirname(extractPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(extractPath, entry.getData());

            files.push({
              name: entry.entryName,
              path: extractPath,
              content: entry.getData().toString('utf-8').substring(0, 50000), // Store first 50K chars
              size: entry.header.size,
            });
          }
        }

        // Clean up uploaded ZIP
        fs.unlinkSync(req.file.path);
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Invalid ZIP file.' });
      }
    } else if (req.file && assignment.type === 'project') {
      // It's a project report (PDF/Docx)
      const uploadDir = path.join(__dirname, '..', 'uploads', 'reports', req.user.id.toString(), assignmentId);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const newPath = path.join(uploadDir, req.file.filename);
      fs.renameSync(req.file.path, newPath);
      submission = submission || {}; // Will be handled below
      submission.projectReport = `/uploads/reports/${req.user.id}/${assignmentId}/${req.file.filename}`;
    } else if (req.body.code && assignment.type === 'code') {
      // Handle raw code string
      const extensions = {
        python: 'py',
        javascript: 'js',
        c: 'c',
        cpp: 'cpp',
        java: 'java'
      };
      
      const ext = extensions[language] || 'txt';
      
      files.push({
        name: `main.${ext}`,
        path: `virtual/main.${ext}`,
        content: req.body.code,
        size: Buffer.byteLength(req.body.code, 'utf8')
      });
    }

    if (submission) {
      // Update existing submission
      submission.language = language || 'none';
      submission.files = files.length > 0 ? files : submission.files;
      submission.githubUrl = githubUrl || submission.githubUrl;
      if (req.file && assignment.type === 'project') {
        submission.projectReport = `/uploads/reports/${req.user.id}/${assignmentId}/${req.file.filename}`;
      }
      submission.status = assignment.type === 'project' ? 'manual_evaluation' : 'pending';
      submission.submittedAt = new Date();
      submission.marks = 0;
      submission.testCasesPassed = 0;
      submission.plagiarismScore = 0;
      submission.feedback = '';
      await submission.save();
    } else {
      // Create new submission
      submission = await Submission.create({
        assignment: assignmentId,
        student: req.user.id,
        language: language || 'none',
        files,
        githubUrl,
        projectReport: (req.file && assignment.type === 'project') ? `/uploads/reports/${req.user.id}/${assignmentId}/${req.file.filename}` : null,
        status: assignment.type === 'project' ? 'manual_evaluation' : 'pending',
      });
    }

    // Emit event to update dashboards in real-time
    try {
      getIO().emit('dashboard:update');
    } catch (err) {
      console.log('Socket not ready');
    }

    res.status(201).json({
      success: true,
      message: 'Submission uploaded successfully.',
      submission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/submissions
 * @desc    List submissions (filtered by role)
 * @access  Private
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { assignmentId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Students see only their own submissions
    if (req.user.role === 'student') {
      filter.student = req.user.id;
    }

    if (assignmentId) filter.assignment = assignmentId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('assignment', 'title course maxMarks dueDate')
        .populate('student', 'name email studentId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Submission.countDocuments(filter),
    ]);

    res.json({
      success: true,
      submissions,
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
 * @route   GET /api/submissions/:id
 * @desc    Get a single submission with details
 * @access  Private
 */
const getSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment', 'title course maxMarks dueDate allowedLanguages')
      .populate('student', 'name email studentId');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Students can only view their own
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Fetch execution results
    const ExecutionResult = require('../models/ExecutionResult');
    let executionResultsFilter = { submission: submission._id };
    
    const executionResults = await ExecutionResult.find(executionResultsFilter)
      .populate('testCase', 'input expectedOutput isHidden order');

    // If student, hide actual output/expected output for hidden test cases if they failed?
    // Usually, we just return them and let the frontend decide, or we blank them out here.
    // For simplicity, we'll return them, but the frontend should hide details for hidden test cases.

    res.json({ success: true, submission: { ...submission.toObject(), executionResults } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/submissions/:id/grade
 * @desc    Manually grade a project submission
 * @access  Faculty, Admin
 */
const gradeProjectSubmission = async (req, res, next) => {
  try {
    const { marks, manualGradeFeedback } = req.body;
    const submission = await Submission.findById(req.params.id).populate('assignment');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (submission.assignment.type !== 'project') {
      return res.status(400).json({ success: false, message: 'Only project submissions can be manually graded.' });
    }

    submission.marks = marks;
    submission.manualGradeFeedback = manualGradeFeedback || '';
    submission.status = 'evaluated';
    submission.evaluatedAt = new Date();
    await submission.save();

    res.json({
      success: true,
      message: 'Project graded successfully.',
      submission
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmission,
  gradeProjectSubmission,
};
