const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const PlagiarismReport = require('../models/PlagiarismReport');
const Notification = require('../models/Notification');
const socket = require('../socket');
const { compareSubmissions, compareAllSubmissions } = require('../services/plagiarismService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * @route   POST /api/plagiarism/check/:assignmentId
 * @desc    Run pairwise plagiarism check on all submissions for an assignment
 * @access  Faculty, Admin
 */
const checkPlagiarism = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Get all submissions with code content
    const submissions = await Submission.find({
      assignment: assignment._id,
      'files.0': { $exists: true },
    }).populate('student', 'name email studentId');

    if (submissions.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 submissions are required for plagiarism detection.',
      });
    }

    // Prepare submission data for comparison
    const submissionData = submissions.map((s) => ({
      id: s._id,
      studentId: s.student._id,
      studentName: s.student.name,
      code: s.files.map((f) => f.content).join('\n'),
      language: s.language,
    }));

    // Run pairwise comparison
    const comparisonResults = compareAllSubmissions(submissionData, submissions[0].language);

    // Save reports to database
    const reports = [];
    for (const result of comparisonResults) {
      const report = await PlagiarismReport.findOneAndUpdate(
        {
          assignment: assignment._id,
          submission1: result.submission1Id,
          submission2: result.submission2Id,
        },
        {
          assignment: assignment._id,
          submission1: result.submission1Id,
          submission2: result.submission2Id,
          student1: result.student1Id,
          student2: result.student2Id,
          similarityScore: result.similarityScore,
          matchingRegions: result.matchingRegions,
          fingerprints1Count: result.fingerprints1Count,
          fingerprints2Count: result.fingerprints2Count,
          commonFingerprintsCount: result.commonFingerprintsCount,
          status: 'completed',
        },
        { upsert: true, new: true }
      );
      reports.push(report);

      // Update plagiarism score on submissions if above threshold
      if (result.similarityScore >= assignment.plagiarismThreshold) {
        // Update both submissions with the highest plagiarism score
        for (const subId of [result.submission1Id, result.submission2Id]) {
          const sub = await Submission.findById(subId);
          if (sub && result.similarityScore > sub.plagiarismScore) {
            sub.plagiarismScore = result.similarityScore;
            await sub.save();
          }
        }

        // Notify faculty
        const notif = await Notification.create({
          user: req.user.id,
          title: 'Plagiarism Alert',
          message: `High similarity (${result.similarityScore}%) detected between two submissions in "${assignment.title}".`,
          type: 'plagiarism',
          link: `/plagiarism`,
        });

        try {
          socket.getIO().to(String(req.user.id)).emit('notification:new', notif);
          socket.getIO().to('faculty').emit('plagiarism:detected', {
            assignmentId: assignment._id,
            score: result.similarityScore
          });
        } catch (err) {
          console.log('Socket not initialized or emit failed:', err.message);
        }
      }
    }

    res.json({
      success: true,
      message: `Plagiarism check complete. ${comparisonResults.length} pairs compared.`,
      totalPairs: comparisonResults.length,
      flaggedPairs: comparisonResults.filter((r) => r.similarityScore >= assignment.plagiarismThreshold).length,
      reports: reports.map((r) => ({
        id: r._id,
        submission1: r.submission1,
        submission2: r.submission2,
        similarityScore: r.similarityScore,
        status: r.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/plagiarism/report/:reportId
 * @desc    Get a detailed plagiarism report
 * @access  Faculty, Admin
 */
const getReport = async (req, res, next) => {
  try {
    const report = await PlagiarismReport.findById(req.params.reportId)
      .populate('submission1')
      .populate('submission2')
      .populate('student1', 'name email studentId')
      .populate('student2', 'name email studentId');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/plagiarism/assignment/:assignmentId
 * @desc    Get all plagiarism reports for an assignment (summary)
 * @access  Faculty, Admin
 */
const getAssignmentReports = async (req, res, next) => {
  try {
    const reports = await PlagiarismReport.find({ assignment: req.params.assignmentId })
      .populate('student1', 'name email studentId')
      .populate('student2', 'name email studentId')
      .sort({ similarityScore: -1 });

    const assignment = await Assignment.findById(req.params.assignmentId);

    res.json({
      success: true,
      assignment: assignment ? { id: assignment._id, title: assignment.title, threshold: assignment.plagiarismThreshold } : null,
      totalReports: reports.length,
      flaggedCount: reports.filter((r) => r.similarityScore >= (assignment?.plagiarismThreshold || 70)).length,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/plagiarism/check-web/:submissionId
 * @desc    Run an AI-powered web plagiarism check on a specific submission
 * @access  Faculty, Admin
 */
const checkWebPlagiarism = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.submissionId).populate('student');
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    const code = submission.files.map(f => f.content).join('\n');
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'Gemini API key missing for web plagiarism check.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
Analyze the following code to determine if it was generated by an AI assistant (such as ChatGPT, GitHub Copilot, Claude, etc.).
Look for typical AI coding patterns, lack of human-like comments, overly generic structures, or specific AI hallmarks.

Code:
\`\`\`
${code}
\`\`\`

Respond strictly in JSON format (do not use markdown blocks):
{
  "isPlagiarized": boolean (true if highly likely to be AI-generated),
  "confidenceScore": number (0-100),
  "sources": ["List of suspected AI models or generation patterns detected"],
  "reasoning": "Detailed explanation of why the code appears AI-generated or human-written"
}
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let aiReport;
    try {
      aiReport = JSON.parse(responseText);
    } catch (e) {
      aiReport = {
        isPlagiarized: false,
        confidenceScore: 0,
        sources: [],
        reasoning: "Failed to parse AI response: " + responseText
      };
    }

    // Save to the submission (assuming we add aiPlagiarismReport to the schema later)
    submission.aiPlagiarismReport = aiReport;
    await submission.save();

    res.json({ success: true, report: aiReport });
  } catch (error) {
    console.error('Web Plagiarism Check Error:', error);
    next(error);
  }
};

module.exports = { checkPlagiarism, getReport, getAssignmentReports, checkWebPlagiarism };
