const mongoose = require('mongoose');

const PeerReviewSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rubricScores: [
      {
        rubricItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        pointsAwarded: {
          type: Number,
          required: true,
        },
        comments: {
          type: String,
        },
      }
    ],
    generalFeedback: {
      type: String,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    }
  },
  { timestamps: true }
);

// A reviewer can only submit one review per submission
PeerReviewSchema.index({ submission: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('PeerReview', PeerReviewSchema);
