const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics tailored to user role
 * @access  Private (Admin, Faculty, Student)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    if (role === 'admin') {
      const [activeAssignments, totalSubmissions, evaluatedSubmissions, pendingSubmissions, recentSubmissions, upcomingDeadlines] = await Promise.all([
        Assignment.countDocuments({ status: 'active' }),
        Submission.countDocuments(),
        Submission.countDocuments({ status: 'evaluated' }),
        Submission.countDocuments({ status: 'pending' }),
        Submission.find()
          .sort({ submittedAt: -1 })
          .limit(5)
          .populate('assignment', 'title')
          .populate('student', 'name'),
        Assignment.find({ status: 'active', dueDate: { $gte: new Date() } })
          .sort({ dueDate: 1 })
          .limit(5)
      ]);

      return res.json({
        success: true,
        stats: {
          activeAssignments,
          totalSubmissions,
          evaluatedSubmissions,
          pendingSubmissions
        },
        recentSubmissions: recentSubmissions.map(s => ({
          name: s.assignment ? s.assignment.title : 'Deleted Assignment',
          student: s.student ? s.student.name : 'Unknown Student',
          status: s.status === 'evaluated' ? 'Evaluated' : s.status === 'executing' ? 'Executing' : 'Pending',
          score: s.status === 'evaluated' ? `${s.marks || 0}/${s.maxMarks || 0}` : '—',
          color: s.status === 'evaluated' ? 'var(--color-emerald)' : s.status === 'executing' ? 'var(--color-amber)' : 'var(--color-text-muted)'
        })),
        upcomingDeadlines: upcomingDeadlines.map(a => {
          const hoursUntilDue = (new Date(a.dueDate) - new Date()) / (1000 * 60 * 60);
          return {
            name: a.title,
            due: hoursUntilDue < 24 ? 'Tomorrow' : `In ${Math.ceil(hoursUntilDue/24)} days`,
            urgent: hoursUntilDue < 48
          };
        })
      });
    } else if (role === 'faculty') {
      const myAssignmentsIds = await Assignment.find({ createdBy: userId }).distinct('_id');
      
      const [myAssignments, totalSubmissions, evaluatedSubmissions, recentSubmissions, activeAssignments] = await Promise.all([
        Assignment.countDocuments({ createdBy: userId }),
        Submission.countDocuments({ assignment: { $in: myAssignmentsIds } }),
        Submission.countDocuments({ assignment: { $in: myAssignmentsIds }, status: 'evaluated' }),
        Submission.find({ assignment: { $in: myAssignmentsIds } })
          .sort({ submittedAt: -1 })
          .limit(5)
          .populate('assignment', 'title')
          .populate('student', 'name'),
        Assignment.find({ createdBy: userId, status: 'active' }).sort({ createdAt: -1 }).limit(5)
      ]);

      return res.json({
        success: true,
        stats: {
          myAssignments,
          totalSubmissions,
          evaluatedSubmissions,
          plagiarismFlags: 0 // Mocked for now, need PlagiarismReport integration if exists
        },
        pendingReviews: recentSubmissions.map(s => ({
          student: s.student ? s.student.name : 'Unknown Student',
          assignment: s.assignment ? s.assignment.title : 'Deleted Assignment',
          lang: s.language || 'Unknown'
        })),
        classPerformance: activeAssignments.map(a => ({
          name: a.title,
          score: Math.floor(Math.random() * 30 + 70) + '%', // Mock average for visual
        }))
      });
    } else if (role === 'student') {
      const [activeAssignments, mySubmissionsTotal, evaluatedSubmissions, mySubmissions, upcomingAssignments] = await Promise.all([
        Assignment.countDocuments({ status: 'active', isPublished: true }),
        Submission.countDocuments({ student: userId }),
        Submission.countDocuments({ student: userId, status: 'evaluated' }),
        Submission.find({ student: userId })
          .sort({ submittedAt: -1 })
          .limit(5)
          .populate('assignment', 'title'),
        Assignment.find({ status: 'active', isPublished: true, dueDate: { $gte: new Date() } })
          .sort({ dueDate: 1 })
          .limit(5)
      ]);

      return res.json({
        success: true,
        stats: {
          activeAssignments,
          mySubmissions: mySubmissionsTotal,
          evaluatedSubmissions,
          pendingSubmissions: mySubmissionsTotal - evaluatedSubmissions
        },
        recentSubmissions: mySubmissions.map(s => ({
          name: s.assignment ? s.assignment.title : 'Deleted Assignment',
          status: s.status === 'evaluated' ? 'Evaluated' : s.status === 'executing' ? 'Executing' : 'Pending',
          score: s.status === 'evaluated' ? `${s.marks || 0}/${s.maxMarks || 0}` : '—',
          color: s.status === 'evaluated' ? 'var(--color-emerald)' : s.status === 'executing' ? 'var(--color-amber)' : 'var(--color-text-muted)'
        })),
        upcomingDeadlines: upcomingAssignments.map(a => {
          const hoursUntilDue = (new Date(a.dueDate) - new Date()) / (1000 * 60 * 60);
          return {
            name: a.title,
            due: hoursUntilDue < 24 ? 'Tomorrow' : `In ${Math.ceil(hoursUntilDue/24)} days`,
            urgent: hoursUntilDue < 48
          };
        })
      });
    }
    
    return res.status(403).json({ success: false, message: 'Invalid role' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
