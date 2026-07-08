const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const PlagiarismReport = require('../models/PlagiarismReport');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get system-wide analytics
 * @access  Admin, Faculty
 */
const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAssignments,
      totalSubmissions,
      evaluatedSubmissions,
      pendingSubmissions,
      plagiarismFlags,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
      req.user.role === 'admin'
        ? Assignment.countDocuments()
        : Assignment.countDocuments({ createdBy: req.user.id }),
      req.user.role === 'admin'
        ? Submission.countDocuments()
        : Submission.countDocuments({
            assignment: { $in: await Assignment.find({ createdBy: req.user.id }).distinct('_id') },
          }),
      Submission.countDocuments({ status: 'evaluated' }),
      Submission.countDocuments({ status: 'pending' }),
      PlagiarismReport.countDocuments({ similarityScore: { $gte: 70 } }),
    ]);

    // Get submission trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const submissionTrend = await Submission.aggregate([
      { $match: { submittedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Score distribution
    const scoreDistribution = await Submission.aggregate([
      { $match: { status: 'evaluated', marks: { $gt: 0 } } },
      {
        $bucket: {
          groupBy: {
            $multiply: [
              { 
                $divide: [
                  '$marks', 
                  { $cond: [ { $gt: ['$maxMarks', 0] }, '$maxMarks', 1 ] }
                ] 
              }, 
              100
            ]
          },
          boundaries: [0, 20, 40, 60, 80, 100.01],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAssignments,
        totalSubmissions,
        evaluatedSubmissions,
        pendingSubmissions,
        plagiarismFlags,
        submissionTrend,
        scoreDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/assignment/:id
 * @desc    Get per-assignment analytics
 * @access  Faculty, Admin
 */
const getAssignmentAnalytics = async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const [
      totalSubmissions,
      evaluatedCount,
      submissions,
      languageDistribution,
    ] = await Promise.all([
      Submission.countDocuments({ assignment: assignmentId }),
      Submission.countDocuments({ assignment: assignmentId, status: 'evaluated' }),
      Submission.find({ assignment: assignmentId, status: 'evaluated' }).select('marks maxMarks'),
      Submission.aggregate([
        { $match: { assignment: assignment._id } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate stats
    const scores = submissions.map((s) => (s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0));
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const passRate = scores.length > 0
      ? (scores.filter((s) => s >= 40).length / scores.length) * 100
      : 0;

    res.json({
      success: true,
      analytics: {
        assignmentTitle: assignment.title,
        totalSubmissions,
        evaluatedCount,
        averageScore: Math.round(avgScore * 100) / 100,
        maxScore: Math.round(maxScore * 100) / 100,
        minScore: Math.round(minScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        languageDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOverview, getAssignmentAnalytics };
