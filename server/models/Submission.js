const mongoose = require('mongoose');

/**
 * Submission Schema
 * Represents a student's project submission for an assignment.
 * Tracks files, language, status, marks, and plagiarism score.
 */
const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    language: {
      type: String,
      enum: ['c', 'cpp', 'python', 'java', 'javascript', 'go', 'ruby', 'rust', 'none'],
      default: 'none',
    },
    files: [{
      name: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        default: '',
      },
      size: {
        type: Number,
        default: 0,
      },
    }],
    githubUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?github\.com\//, 'Please provide a valid GitHub URL'],
    },
    projectReport: {
      type: String, // Path to the uploaded PDF/Docx
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'executing', 'evaluated', 'error', 'manual_evaluation'],
      default: 'pending',
    },
    // Evaluation results
    marks: {
      type: Number,
      default: 0,
    },
    maxMarks: {
      type: Number,
      default: 0,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: '',
    },
    manualGradeFeedback: {
      type: String,
      default: '',
    },
    plagiarismScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    evaluatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one submission per student per assignment (can be extended for resubmissions)
submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ student: 1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
