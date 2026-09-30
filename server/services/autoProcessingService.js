const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const TestCase = require('../models/TestCase');
const ExecutionResult = require('../models/ExecutionResult');
const PlagiarismReport = require('../models/PlagiarismReport');
const Notification = require('../models/Notification');
const CodeRun = require('../models/CodeRun');
const { executeInDocker, executeUnitTest } = require('./executionService');
const staticAnalysisService = require('./staticAnalysisService');
const { compareAllSubmissions } = require('./plagiarismService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const socket = require('../socket');

/**
 * Auto-Processing Service
 * 
 * Orchestrates the full evaluation pipeline after a student submits code:
 * 1. Execute code against test cases (public + hidden)
 * 2. Run static analysis for code quality scoring
 * 3. Run pairwise plagiarism detection against all other submissions
 * 4. Send real-time notifications to student and faculty
 * 
 * This runs asynchronously (fire-and-forget) so the student gets an
 * immediate submission response without waiting for evaluation.
 */

/**
 * Process a submission through the full evaluation + plagiarism pipeline.
 * 
 * @param {string} submissionId - The MongoDB ObjectId of the submission
 */
async function processSubmission(submissionId) {
  try {
    console.log(`🔄 Auto-processing started for submission ${submissionId}`);

    const submission = await Submission.findById(submissionId)
      .populate('student', 'name email');

    if (!submission) {
      console.error(`❌ Auto-processing: Submission ${submissionId} not found`);
      return;
    }

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      console.error(`❌ Auto-processing: Assignment not found for submission ${submissionId}`);
      return;
    }

    // Skip auto-evaluation for project-type assignments (they need manual grading)
    if (assignment.type === 'project') {
      console.log(`⏭️  Skipping auto-evaluation for project-type assignment: ${assignment.title}`);
      return;
    }

    // Skip if autoEvaluate is explicitly disabled
    if (assignment.autoEvaluate === false) {
      console.log(`⏭️  Auto-evaluate disabled for assignment: ${assignment.title}`);
      return;
    }

    // Step 1: Run code execution against test cases
    await runCodeEvaluation(submission, assignment);

    // Step 2: Run static analysis
    await runStaticAnalysis(submissionId);

    // Step 3: Run pairwise plagiarism detection against all other submissions
    await runPlagiarismDetection(submission, assignment);

    // Step 4: Run AI Code Plagiarism check
    await runAiCodeDetection(submissionId);

    console.log(`✅ Auto-processing complete for submission ${submissionId}`);
  } catch (error) {
    console.error(`❌ Auto-processing error for submission ${submissionId}:`, error);

    // Mark submission as error so student knows something went wrong
    try {
      await Submission.findByIdAndUpdate(submissionId, {
        status: 'error',
        feedback: 'Automatic evaluation encountered an error. Please contact your instructor.',
      });
    } catch (updateErr) {
      console.error('Failed to update submission status to error:', updateErr);
    }
  }
}

/**
 * Step 1: Execute the submission's code against all test cases.
 * Mirrors the logic in executionController.executeSubmission but runs headlessly.
 */
async function runCodeEvaluation(submission, assignment) {
  // Get test cases for the assignment
  const testCases = await TestCase.find({ assignment: assignment._id }).sort({ order: 1 });

  if (testCases.length === 0) {
    console.log(`⚠️  No test cases defined for assignment "${assignment.title}", skipping execution`);
    submission.status = 'evaluated';
    submission.feedback = 'No test cases defined for this assignment.';
    submission.evaluatedAt = new Date();
    await submission.save();
    return;
  }

  // Update status to executing
  submission.status = 'executing';
  await submission.save();

  // Emit real-time status update
  emitSafe('submission:status', {
    submissionId: submission._id,
    status: 'executing',
  });

  // Get source code
  const mainFile = submission.files.find((f) => f.content) || submission.files[0];
  if (!mainFile || !mainFile.content) {
    submission.status = 'error';
    submission.feedback = 'No source code found in submission.';
    await submission.save();
    return;
  }

  const code = mainFile.content;
  let totalPassed = 0;
  let earnedWeight = 0;
  let totalWeight = 0;
  const results = [];

  // Check if unit testing framework is used
  if (assignment.testFramework && assignment.testFramework !== 'none') {
    const result = await executeUnitTest(
      code,
      submission.language,
      assignment.unitTestCode,
      assignment.testFramework
    );

    const isPassed = result.exitCode === 0;
    totalPassed = result.testsPassed || (isPassed ? 1 : 0);
    const total = result.totalTests || 1;

    await ExecutionResult.findOneAndUpdate(
      { submission: submission._id, testCase: null },
      {
        submission: submission._id,
        testCase: null,
        actualOutput: result.output,
        expectedOutput: `All ${total} tests passed.`,
        passed: isPassed,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: result.error,
        exitCode: result.exitCode,
        status: result.status,
      },
      { upsert: true, new: true }
    );

    earnedWeight = totalPassed;
    totalWeight = total;
    results.push(result);
  } else {
    // Standard I/O test case execution
    for (const tc of testCases) {
      const result = await executeInDocker(
        code,
        submission.language,
        tc.input,
        tc.timeLimit || 5000,
        tc.memoryLimit || 256
      );

      const actualOutput = result.output ? result.output.trim() : '';
      const expectedOutput = tc.expectedOutput ? tc.expectedOutput.trim() : '';
      const isPassed = !result.error && result.exitCode === 0 && actualOutput === expectedOutput;

      if (isPassed) {
        totalPassed++;
        earnedWeight += tc.weight || 1;
      }
      totalWeight += tc.weight || 1;

      await ExecutionResult.findOneAndUpdate(
        { submission: submission._id, testCase: tc._id },
        {
          submission: submission._id,
          testCase: tc._id,
          actualOutput,
          expectedOutput,
          passed: isPassed,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: result.error || (result.exitCode !== 0 ? `Exit code ${result.exitCode}` : null),
          exitCode: result.exitCode || 0,
          status: isPassed ? 'completed' : 'error',
        },
        { upsert: true, new: true }
      );
      results.push(result);
    }
  }

  // Calculate marks
  const scorePercentage = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const marks = Math.round(scorePercentage * assignment.maxMarks);
  const hasError = results.some((r) => r.status === 'error');

  let runStatus = 'Accepted';
  if (hasError) runStatus = 'Error';
  else if (totalPassed < testCases.length) runStatus = 'Wrong Answer';

  // Log the code run
  await CodeRun.create({
    student: submission.student._id,
    assignment: assignment._id,
    type: 'submit',
    status: runStatus,
    language: submission.language,
    testCasesPassed: totalPassed,
    totalTestCases: testCases.length,
  });

  // Re-fetch submission (static analysis may have already modified it in a parallel scenario)
  const updatedSubmission = await Submission.findById(submission._id);

  // Update submission with evaluation results
  updatedSubmission.status = 'evaluated';
  updatedSubmission.marks = marks;
  updatedSubmission.maxMarks = assignment.maxMarks;
  updatedSubmission.testCasesPassed = totalPassed;
  updatedSubmission.totalTestCases = testCases.length;
  updatedSubmission.evaluatedAt = new Date();
  updatedSubmission.feedback = `Passed ${totalPassed}/${testCases.length} test cases. Score: ${marks}/${assignment.maxMarks}`;
  await updatedSubmission.save();

  // Send notification to student
  const notif = await Notification.create({
    user: submission.student._id,
    title: 'Submission Evaluated',
    message: `Your submission for "${assignment.title}" has been automatically evaluated. Score: ${marks}/${assignment.maxMarks}`,
    type: 'result',
    link: `/submissions/${submission._id}`,
  });

  emitToUser(submission.student._id, 'notification:new', notif);
  emitToUser(submission.student._id, 'submission:evaluated', {
    submissionId: submission._id,
    status: 'evaluated',
    marks,
    maxMarks: assignment.maxMarks,
    testCasesPassed: totalPassed,
    totalTestCases: testCases.length,
  });
  emitSafe('dashboard:update');

  console.log(`📊 Evaluation complete: ${totalPassed}/${testCases.length} passed, ${marks}/${assignment.maxMarks} marks`);
}

/**
 * Step 2: Run static analysis for code quality scoring.
 */
async function runStaticAnalysis(submissionId) {
  try {
    await staticAnalysisService.analyzeSubmission(submissionId);
    console.log(`🔍 Static analysis complete for submission ${submissionId}`);
  } catch (error) {
    console.error(`⚠️  Static analysis failed for submission ${submissionId}:`, error.message);
    // Non-fatal: don't block the rest of the pipeline
  }
}

/**
 * Step 3: Run pairwise plagiarism detection against all other submissions
 * for the same assignment.
 */
async function runPlagiarismDetection(submission, assignment) {
  try {
    // Get all submissions for this assignment that have code content
    const allSubmissions = await Submission.find({
      assignment: assignment._id,
      'files.0': { $exists: true },
    }).populate('student', 'name email studentId');

    if (allSubmissions.length < 2) {
      console.log(`⏭️  Only ${allSubmissions.length} submission(s) — skipping plagiarism detection`);
      return;
    }

    // Prepare submission data for comparison
    const submissionData = allSubmissions.map((s) => ({
      id: s._id,
      studentId: s.student._id,
      studentName: s.student.name,
      code: s.files.map((f) => f.content).join('\n'),
      language: s.language,
    }));

    // Run pairwise comparison
    const comparisonResults = compareAllSubmissions(submissionData, submission.language);

    // Save reports to database
    for (const result of comparisonResults) {
      await PlagiarismReport.findOneAndUpdate(
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

      // Update plagiarism score on submissions if above threshold
      if (result.similarityScore >= assignment.plagiarismThreshold) {
        for (const subId of [result.submission1Id, result.submission2Id]) {
          const sub = await Submission.findById(subId);
          if (sub && result.similarityScore > sub.plagiarismScore) {
            sub.plagiarismScore = result.similarityScore;
            await sub.save();
          }
        }

        // Notify faculty who created the assignment
        const notif = await Notification.create({
          user: assignment.createdBy,
          title: 'Plagiarism Alert',
          message: `High similarity (${result.similarityScore.toFixed(1)}%) detected between two submissions in "${assignment.title}".`,
          type: 'plagiarism',
          link: `/plagiarism`,
        });

        // Notify student 1
        const notifS1 = await Notification.create({
          user: result.student1Id,
          title: 'Plagiarism Warning',
          message: `High similarity (${result.similarityScore.toFixed(1)}%) detected in your submission for "${assignment.title}".`,
          type: 'plagiarism',
          link: `/assignments/${assignment._id}`,
        });

        // Notify student 2
        const notifS2 = await Notification.create({
          user: result.student2Id,
          title: 'Plagiarism Warning',
          message: `High similarity (${result.similarityScore.toFixed(1)}%) detected in your submission for "${assignment.title}".`,
          type: 'plagiarism',
          link: `/assignments/${assignment._id}`,
        });

        emitToUser(assignment.createdBy, 'notification:new', notif);
        emitToUser(result.student1Id, 'notification:new', notifS1);
        emitToUser(result.student2Id, 'notification:new', notifS2);
        
        emitSafe('plagiarism:detected', {
          assignmentId: assignment._id,
          score: result.similarityScore,
        });
      }
    }

    const flaggedCount = comparisonResults.filter(
      (r) => r.similarityScore >= assignment.plagiarismThreshold
    ).length;

    console.log(`🕵️  Plagiarism detection complete: ${comparisonResults.length} pairs compared, ${flaggedCount} flagged`);
  } catch (error) {
    console.error(`⚠️  Plagiarism detection failed:`, error.message);
    // Non-fatal: evaluation results are already saved
  }
}

// ======================= Socket Helpers =======================

/**
 * Safely emit a Socket.IO event (won't crash if socket not initialized).
 */
function emitSafe(event, data) {
  try {
    if (data !== undefined) {
      socket.getIO().emit(event, data);
    } else {
      socket.getIO().emit(event);
    }
  } catch (err) {
    // Socket not ready — that's OK during auto-processing
  }
}

/**
 * Safely emit a Socket.IO event to a specific user room.
 */
function emitToUser(userId, event, data) {
  try {
    socket.getIO().to(String(userId)).emit(event, data);
  } catch (err) {
    // Socket not ready
  }
}

/**
 * Step 4: Run AI Code Plagiarism detection
 */
async function runAiCodeDetection(submissionId) {
  try {
    const submission = await Submission.findById(submissionId).populate('student');
    if (!submission || !submission.files || submission.files.length === 0) return;

    const code = submission.files.map(f => f.content).join('\n');
    if (!process.env.GEMINI_API_KEY) {
      console.log('Gemini API key missing, skipping AI code detection');
      return;
    }

    console.log(`🤖 Running AI code plagiarism check for submission ${submissionId}`);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

    // Save to the submission
    submission.aiPlagiarismReport = aiReport;
    await submission.save();
    
    // Emit real-time status update
    emitSafe('submission:status', {
      submissionId: submission._id,
      status: 'evaluated', // Finished all evaluations
    });

    console.log(`✅ AI code plagiarism check complete for ${submissionId}: ${aiReport.isPlagiarized ? 'FLAGGED' : 'CLEAR'}`);
  } catch (error) {
    console.error(`⚠️ AI code plagiarism check failed for ${submissionId}:`, error.message);
  }
}

module.exports = {
  processSubmission,
};
