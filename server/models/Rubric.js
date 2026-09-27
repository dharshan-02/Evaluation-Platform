const mongoose = require('mongoose');

const RubricItemSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  maxPoints: {
    type: Number,
    required: true,
  },
});

const RubricSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [RubricItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rubric', RubricSchema);
