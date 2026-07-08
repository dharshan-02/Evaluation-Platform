const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  textSnippet: {
    type: String,
    required: true,
  },
  sourceUrl: {
    type: String,
    required: true,
  },
  similarityScore: {
    type: Number,
    required: true, // percentage match for this chunk
  }
});

const documentPlagiarismReportSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // Refers to the specific review inside project.reviews
  },
  documentName: {
    type: String,
    required: true,
  },
  overallSimilarity: {
    type: Number,
    required: true, // Overall plagiarism percentage
  },
  matches: [matchSchema],
  scannedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// A review can have multiple documents checked (e.g. presentation and report)
documentPlagiarismReportSchema.index({ project: 1, reviewId: 1 });

module.exports = mongoose.model('DocumentPlagiarismReport', documentPlagiarismReportSchema);
