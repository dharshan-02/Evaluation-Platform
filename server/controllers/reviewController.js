const PeerReview = require('../models/PeerReview');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');

// @desc    Get all peer reviews for a submission
// @route   GET /api/submissions/:submissionId/reviews
// @access  Private
exports.getReviewsForSubmission = async (req, res, next) => {
  try {
    const submissionId = req.params.submissionId;
    const submission = await Submission.findById(submissionId).populate('assignment');
    
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Students can only see their own reviews if they are completed
    let query = { submission: submissionId };
    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      // If student is reviewing this, they can only see their own draft/submission
      query.reviewer = req.user.id;
    } else if (req.user.role === 'student') {
      // The student who submitted it can only see submitted reviews, not drafts
      query.status = 'submitted';
    }

    const reviews = await PeerReview.find(query).populate('reviewer', 'name email');
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit or update a peer review
// @route   POST /api/submissions/:submissionId/reviews
// @access  Private (Students)
exports.submitPeerReview = async (req, res, next) => {
  try {
    const submissionId = req.params.submissionId;
    const { rubricScores, generalFeedback, status } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Calculate total score
    const totalScore = rubricScores.reduce((acc, curr) => acc + Number(curr.pointsAwarded), 0);

    let review = await PeerReview.findOne({ submission: submissionId, reviewer: req.user.id });

    if (review) {
      if (review.status === 'submitted' && req.user.role === 'student') {
        return res.status(400).json({ success: false, message: 'Review has already been submitted and cannot be edited.' });
      }
      review.rubricScores = rubricScores;
      review.generalFeedback = generalFeedback;
      review.totalScore = totalScore;
      review.status = status || 'draft';
      await review.save();
    } else {
      review = await PeerReview.create({
        submission: submissionId,
        reviewer: req.user.id,
        rubricScores,
        generalFeedback,
        totalScore,
        status: status || 'draft',
      });
    }

    res.json({ success: true, review });
  } catch (error) {
    next(error);
  }
};
