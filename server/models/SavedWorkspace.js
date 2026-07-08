const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' }
});

const savedWorkspaceSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  teamMembers: [{
    type: String
  }],
  files: [fileSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SavedWorkspace', savedWorkspaceSchema);
