const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100,
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded', 'overdue'],
    default: 'pending'
  },
  submission: {
    githubUrl: String,
    reportFile: String,
    presentationFile: String,
    submittedAt: Date
  },
  grading: {
    marks: Number,
    feedback: String,
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: Date
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
  },
  githubUrl: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    trim: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guide: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviews: [reviewSchema]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
