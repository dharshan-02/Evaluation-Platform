const mongoose = require('mongoose');

/**
 * PlagiarismReport Schema
 * Stores pairwise comparison results between two submissions.
 * Contains fingerprint data and matching regions for visualization.
 */
const plagiarismReportSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    submission1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    submission2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    student1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    student2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchingRegions: [{
      file1: {
        start: Number,
        end: Number,
        content: String,
      },
      file2: {
        start: Number,
        end: Number,
        content: String,
      },
    }],
    fingerprints1Count: {
      type: Number,
      default: 0,
    },
    fingerprints2Count: {
      type: Number,
      default: 0,
    },
    commonFingerprintsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'error'],
      default: 'pending',
    },
    error: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
plagiarismReportSchema.index({ assignment: 1 });
plagiarismReportSchema.index({ submission1: 1, submission2: 1 });
plagiarismReportSchema.index({ similarityScore: -1 });

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
