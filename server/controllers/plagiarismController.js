const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const PlagiarismReport = require('../models/PlagiarismReport');
const Notification = require('../models/Notification');
const socket = require('../socket');
const { compareSubmissions, compareAllSubmissions } = require('../services/plagiarismService');

/**
 * @route   POST /api/plagiarism/check/:assignmentId
 * @desc    Run pairwise plagiarism check on all submissions for an assignment
 * @access  Faculty, Admin
 */
const checkPlagiarism = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Get all submissions with code content
    const submissions = await Submission.find({
      assignment: assignment._id,
      'files.0': { $exists: true },
    }).populate('student', 'name email studentId');

    if (submissions.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 submissions are required for plagiarism detection.',
      });
    }

    // Prepare submission data for comparison
    const submissionData = submissions.map((s) => ({
      id: s._id,
      studentId: s.student._id,
      studentName: s.student.name,
      code: s.files.map((f) => f.content).join('\n'),
      language: s.language,
    }));

    // Run pairwise comparison
    const comparisonResults = compareAllSubmissions(submissionData, submissions[0].language);

    // Save reports to database
    const reports = [];
    for (const result of comparisonResults) {
      const report = await PlagiarismReport.findOneAndUpdate(
        {
          assignment: assignment._id,
          submission1: result.submission1Id,
          submission2: result.submission2Id,
        },
        {
          assignment: assignment._id,
          submission1: result.submission1Id,
          submission2: result.submission2Id,
          student1: result.student1Id,
          student2: result.student2Id,
          similarityScore: result.similarityScore,
          matchingRegions: result.matchingRegions,
          fingerprints1Count: result.fingerprints1Count,
          fingerprints2Count: result.fingerprints2Count,
          commonFingerprintsCount: result.commonFingerprintsCount,
          status: 'completed',
        },
        { upsert: true, new: true }
      );
      reports.push(report);

      // Update plagiarism score on submissions if above threshold
      if (result.similarityScore >= assignment.plagiarismThreshold) {
        // Update both submissions with the highest plagiarism score
        for (const subId of [result.submission1Id, result.submission2Id]) {
          const sub = await Submission.findById(subId);
          if (sub && result.similarityScore > sub.plagiarismScore) {
            sub.plagiarismScore = result.similarityScore;
            await sub.save();
          }
        }

        // Notify faculty
        const notif = await Notification.create({
          user: req.user.id,
          title: 'Plagiarism Alert',
          message: `High similarity (${result.similarityScore}%) detected between two submissions in "${assignment.title}".`,
          type: 'plagiarism',
          link: `/plagiarism`,
        });

        try {
          socket.getIO().to(String(req.user.id)).emit('notification:new', notif);
          socket.getIO().to('faculty').emit('plagiarism:detected', {
            assignmentId: assignment._id,
            score: result.similarityScore
          });
        } catch (err) {
          console.log('Socket not initialized or emit failed:', err.message);
        }
      }
    }

    res.json({
      success: true,
      message: `Plagiarism check complete. ${comparisonResults.length} pairs compared.`,
      totalPairs: comparisonResults.length,
      flaggedPairs: comparisonResults.filter((r) => r.similarityScore >= assignment.plagiarismThreshold).length,
      reports: reports.map((r) => ({
        id: r._id,
        submission1: r.submission1,
        submission2: r.submission2,
        similarityScore: r.similarityScore,
        status: r.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/plagiarism/report/:reportId
 * @desc    Get a detailed plagiarism report
 * @access  Faculty, Admin
 */
const getReport = async (req, res, next) => {
  try {
    const report = await PlagiarismReport.findById(req.params.reportId)
      .populate('submission1')
      .populate('submission2')
      .populate('student1', 'name email studentId')
      .populate('student2', 'name email studentId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/plagiarism/assignment/:assignmentId
 * @desc    Get all plagiarism reports for an assignment (summary)
 * @access  Faculty, Admin
 */
const getAssignmentReports = async (req, res, next) => {
  try {
    const reports = await PlagiarismReport.find({ assignment: req.params.assignmentId })
      .populate('student1', 'name email studentId')
      .populate('student2', 'name email studentId')
      .sort({ similarityScore: -1 });

    const assignment = await Assignment.findById(req.params.assignmentId);

    res.json({
      success: true,
      assignment: assignment ? { id: assignment._id, title: assignment.title, threshold: assignment.plagiarismThreshold } : null,
      totalReports: reports.length,
      flaggedCount: reports.filter((r) => r.similarityScore >= (assignment?.plagiarismThreshold || 70)).length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkPlagiarism, getReport, getAssignmentReports };
