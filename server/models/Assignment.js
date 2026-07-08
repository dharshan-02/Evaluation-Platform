const mongoose = require('mongoose');

/**
 * Assignment Schema
 * Created by Faculty, visible to Students.
 * Supports multiple programming languages and file attachments.
 */
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: ['code', 'project'],
      default: 'code',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [10000, 'Description too long'],
    },
    constraints: {
      type: String,
      default: '',
      maxlength: [5000, 'Constraints too long'],
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Max marks must be at least 1'],
      max: [1000, 'Max marks cannot exceed 1000'],
    },
    allowedLanguages: {
      type: [String],
      enum: ['c', 'cpp', 'python', 'java', 'javascript', 'go', 'ruby', 'rust'],
      default: ['c', 'cpp', 'python', 'java', 'javascript', 'go', 'ruby', 'rust'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachments: [{
      name: String,
      path: String,
      size: Number,
    }],
    isPublished: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    // Evaluation settings
    autoEvaluate: {
      type: Boolean,
      default: true,
    },
    plagiarismThreshold: {
      type: Number,
      default: 70, // Flag if similarity > 70%
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for test cases count
assignmentSchema.virtual('testCases', {
  ref: 'TestCase',
  localField: '_id',
  foreignField: 'assignment',
  count: true,
});

// Virtual for submissions count
assignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignment',
  count: true,
});

// Indexes
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ course: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
