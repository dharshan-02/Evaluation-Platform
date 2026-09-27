const mongoose = require('mongoose');

const codeRunSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    type: {
      type: String,
      enum: ['run', 'submit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Accepted', 'Wrong Answer', 'Error', 'Time Limit Exceeded'],
      default: 'Error',
    },
    language: {
      type: String,
      required: true,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

codeRunSchema.index({ student: 1, assignment: 1, createdAt: -1 });

module.exports = mongoose.model('CodeRun', codeRunSchema);
