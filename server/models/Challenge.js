const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true, // e.g. 'python', 'javascript', 'c'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  levelNumber: {
    type: Number,
    required: true,
    default: 1,
  },
  points: {
    type: Number,
    required: true,
    default: 10,
  },
  defaultCode: {
    type: String,
    required: true,
  },
  testCases: [
    {
      input: { type: String, default: '' },
      expectedOutput: { type: String, required: true },
      isHidden: { type: Boolean, default: false }
    }
  ],
  completions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);
