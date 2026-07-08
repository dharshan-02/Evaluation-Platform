const mongoose = require('mongoose');

/**
 * ExecutionResult Schema
 * Records the outcome of running a submission against a single test case.
 * Tracks output, pass/fail, timing, memory, and errors.
 */
const executionResultSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: true,
    },
    actualOutput: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      default: '',
    },
    passed: {
      type: Boolean,
      default: false,
    },
    executionTime: {
      type: Number, // milliseconds
      default: 0,
    },
    memoryUsed: {
      type: Number, // MB
      default: 0,
    },
    error: {
      type: String,
      default: '',
    },
    exitCode: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'timeout', 'error'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
executionResultSchema.index({ submission: 1 });
executionResultSchema.index({ submission: 1, testCase: 1 }, { unique: true });

module.exports = mongoose.model('ExecutionResult', executionResultSchema);
