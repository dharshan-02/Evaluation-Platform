const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Null if the slot is open
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'booked', 'completed', 'cancelled'],
      default: 'open',
    },
    notes: {
      type: String, // Feedback after the viva
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', InterviewSchema);
