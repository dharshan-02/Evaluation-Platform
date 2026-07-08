const mongoose = require('mongoose');

/**
 * TestCase Schema
 * Linked to an Assignment. Can be hidden from students.
 * Each test case has input/output, time/memory limits, and a weight.
 */
const testCaseSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment reference is required'],
    },
    title: {
      type: String,
      trim: true,
      default: 'Test Case',
    },
    input: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      required: [true, 'Expected output is required'],
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    weight: {
      type: Number,
      default: 1,
      min: [0, 'Weight cannot be negative'],
    },
    timeLimit: {
      type: Number,
      default: 5000, // 5 seconds in ms
      min: [500, 'Time limit must be at least 500ms'],
      max: [30000, 'Time limit cannot exceed 30s'],
    },
    memoryLimit: {
      type: Number,
      default: 128, // 128 MB
      min: [16, 'Memory limit must be at least 16MB'],
      max: [512, 'Memory limit cannot exceed 512MB'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
testCaseSchema.index({ assignment: 1, order: 1 });

module.exports = mongoose.model('TestCase', testCaseSchema);
