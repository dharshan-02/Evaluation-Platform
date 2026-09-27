const Submission = require('../models/Submission');
const TestCase = require('../models/TestCase');
const ExecutionResult = require('../models/ExecutionResult');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const CodeRun = require('../models/CodeRun');
const socket = require('../socket');
const { executeInDocker, executeUnitTest } = require('../services/executionService');

/**
 * @route   POST /api/execute/:submissionId
 * @desc    Execute a submission against all test cases
 * @access  Faculty, Admin
 */
const executeSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('student', 'name email');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Security check: if student, they can only execute their own submission
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to execute this submission.' });
    }

    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Get all test cases for the assignment
    const testCases = await TestCase.find({ assignment: assignment._id }).sort({ order: 1 });

    if (testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'No test cases defined for this assignment.' });
    }

    // Update submission status
    submission.status = 'executing';
    await submission.save();

    // Get the main source code from files
    const mainFile = submission.files.find((f) => f.content) || submission.files[0];
    if (!mainFile || !mainFile.content) {
      submission.status = 'error';
      submission.feedback = 'No source code found in submission.';
      await submission.save();
      return res.status(400).json({ success: false, message: 'No source code found.' });
    }

    const code = mainFile.content;

    let totalPassed = 0;
    let earnedWeight = 0;
    let totalWeight = 0;
    const results = [];

    // Check if Unit Testing Framework is used
    if (assignment.testFramework && assignment.testFramework !== 'none') {
      const result = await executeUnitTest(code, submission.language, assignment.unitTestCode, assignment.testFramework);
      
      const isPassed = result.exitCode === 0;
      totalPassed = result.testsPassed || (isPassed ? 1 : 0);
      const total = result.totalTests || 1;
      
      // Save a single ExecutionResult for the unit test
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
          status: result.status
        },
        { upsert: true, new: true }
      );
      
      earnedWeight = totalPassed;
      totalWeight = total;
      results.push(result);
    } else {
      // Standard I/O Test Cases Execution
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

        // Save ExecutionResult for each testcase
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
            status: isPassed ? 'completed' : 'error'
          },
          { upsert: true, new: true }
        );
        results.push(result);
      }
    }

    // Calculate Marks
    const scorePercentage = totalWeight > 0 ? (earnedWeight / totalWeight) : 0;
    const marks = Math.round(scorePercentage * assignment.maxMarks);
    const hasError = results.some(r => r.status === 'error');
    
    let runStatus = 'Accepted';
    if (hasError) runStatus = 'Error';
    else if (totalPassed < testCases.length) runStatus = 'Wrong Answer';

    // Log the run
    await CodeRun.create({
      student: submission.student._id,
      assignment: assignment._id,
      type: 'submit',
      status: runStatus,
      language: submission.language,
      testCasesPassed: totalPassed,
      totalTestCases: testCases.length
    });

    // Run Static Analysis (Code Quality)
    const staticAnalysisService = require('../services/staticAnalysisService');
    await staticAnalysisService.analyzeSubmission(submission._id);

    // Fetch the updated submission since staticAnalysisService modified it
    const updatedSubmission = await Submission.findById(submission._id);

    // Update Submission details from execution
    updatedSubmission.status = 'evaluated';
    updatedSubmission.marks = marks;
    updatedSubmission.maxMarks = assignment.maxMarks;
    updatedSubmission.testCasesPassed = totalPassed;
    updatedSubmission.totalTestCases = testCases.length;
    updatedSubmission.evaluatedAt = new Date();
    updatedSubmission.feedback = `Passed ${totalPassed}/${testCases.length} test cases. Score: ${marks}/${assignment.maxMarks}`;
    await updatedSubmission.save();

    // Create Notification
    const notif = await Notification.create({
      user: submission.student._id,
      title: 'Submission Evaluated',
      message: `Your submission has been evaluated. Score: ${marks}/${assignment.maxMarks}`,
      type: 'result',
      link: `/submissions/${submission._id}`,
    });

    try {
      socket.getIO().to(String(submission.student._id)).emit('notification:new', notif);
      socket.getIO().to(String(submission.student._id)).emit('submission:evaluated', {
        submissionId: submission._id,
        status: 'evaluated',
        marks,
        codeQualityScore: updatedSubmission.codeQualityScore
      });
      socket.getIO().emit('dashboard:update');
    } catch (err) {
      console.log('Socket emit failed:', err.message);
    }

    res.json({
      success: true,
      message: 'Submission evaluated successfully.',
      submission: {
        id: submission._id,
        status: 'evaluated',
        marks
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/execute/:submissionId/results
 * @desc    Get execution results for a submission
 * @access  Private
 */
const getExecutionResults = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Students can only view their own
    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const results = await ExecutionResult.find({ submission: submission._id })
      .populate('testCase', 'title input expectedOutput isHidden weight order')
      .sort({ 'testCase.order': 1 });

    // For students, filter out hidden test case details
    const filteredResults = results.map((r) => {
      const result = r.toObject();
      if (req.user.role === 'student' && result.testCase?.isHidden) {
        result.testCase.input = '[Hidden]';
        result.testCase.expectedOutput = '[Hidden]';
        result.actualOutput = result.passed ? 'Passed' : 'Failed';
      }
      return result;
    });

    res.json({
      success: true,
      results: filteredResults,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.passed).length,
        failed: results.filter((r) => !r.passed).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/execute/test/playground
 * @desc    Execute arbitrary code for the playground
 * @access  Private
 */
const executeCodePlayground = async (req, res, next) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required.' });
    }

    // Default limits for playground
    const timeLimit = 5000; // 5 seconds
    const memoryLimit = 256; // 256 MB

    const result = await executeInDocker(
      code,
      language,
      input || '',
      timeLimit,
      memoryLimit
    );

    res.json({
      success: true,
      result: {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        exitCode: result.exitCode,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/execute/run-public
 * @desc    Execute code against public test cases only (No submission)
 * @access  Private
 */
const executePublicTestCases = async (req, res, next) => {
  try {
    const { assignmentId, code, language } = req.body;

    if (!code || !language || !assignmentId) {
      return res.status(400).json({ success: false, message: 'Assignment ID, code, and language are required.' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Get only PUBLIC test cases
    const testCases = await TestCase.find({ assignment: assignment._id, isHidden: false }).sort({ order: 1 });

    if (testCases.length === 0) {
      return res.status(400).json({ success: false, message: 'No public test cases defined for this assignment.' });
    }

    let totalPassed = 0;
    const results = [];

    // Execute against each test case
    for (const tc of testCases) {
      const result = await executeInDocker(
        code,
        language,
        tc.input,
        tc.timeLimit,
        tc.memoryLimit
      );

      const actualOutput = result.output.trim();
      const expectedOutput = tc.expectedOutput.trim();
      
      // Compare output
      // Handle trailing spaces or newlines gracefully
      const isPassed = !result.error && result.exitCode === 0 && actualOutput === expectedOutput;

      if (isPassed) {
        totalPassed++;
      }

      results.push({
        testCase: tc,
        passed: isPassed,
        actualOutput: actualOutput,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        error: result.error || (result.exitCode !== 0 ? `Process exited with code ${result.exitCode}` : null),
      });
    }

    let runStatus = 'Accepted';
    if (results.some(r => r.error)) runStatus = 'Error';
    else if (totalPassed < testCases.length) runStatus = 'Wrong Answer';

    // Log the run for the logged-in user if available
    if (req.user) {
      await CodeRun.create({
        student: req.user.id,
        assignment: assignment._id,
        type: 'run',
        status: runStatus,
        language,
        testCasesPassed: totalPassed,
        totalTestCases: testCases.length
      });
    }

    res.json({
      success: true,
      message: `Execution complete. ${totalPassed}/${testCases.length} public test cases passed.`,
      results,
      summary: {
        marks: totalPassed, // Just a placeholder, since it's not actually submitting
        maxMarks: testCases.length,
        testCasesPassed: totalPassed,
        totalTestCases: testCases.length,
        status: 'evaluated',
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/execute/challenge/:id
 * @desc    Execute a playground challenge against test cases
 * @access  Private
 */
const executeChallenge = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required.' });
    }

    const timeLimit = 5000;
    const memoryLimit = 256;
    let allPassed = true;
    const results = [];

    // Run against each test case
    for (const tc of challenge.testCases) {
      const result = await executeInDocker(
        code,
        language,
        tc.input || '',
        timeLimit,
        memoryLimit
      );

      const actualOutput = result.output ? result.output.trim() : '';
      const expectedOutput = tc.expectedOutput ? tc.expectedOutput.trim() : '';
      const passed = actualOutput === expectedOutput && !result.error;

      if (!passed) allPassed = false;

      results.push({
        input: tc.isHidden ? 'Hidden Test Case' : tc.input,
        expectedOutput: tc.isHidden ? 'Hidden Output' : expectedOutput,
        actualOutput: tc.isHidden && passed ? 'Hidden Output' : actualOutput,
        passed,
        error: result.error,
        executionTime: result.executionTime,
      });
    }

    // Award points if all passed
    let pointsAwarded = 0;
    if (allPassed && req.user) {
      const user = await User.findById(req.user.id);
      
      const alreadyCompleted = user.completedChallenges.includes(challenge._id);
      
      if (!alreadyCompleted) {
        user.completedChallenges.push(challenge._id);
        user.points += challenge.points;
        pointsAwarded = challenge.points;
        
        challenge.completions += 1;
        await challenge.save();

        // Badge logic
        if (user.points >= 100 && !user.badges.includes('Code Ninja')) {
          user.badges.push('Code Ninja');
        }
        if (challenge.level === 'Advanced' && !user.badges.includes('Bug Squasher')) {
          user.badges.push('Bug Squasher');
        }

        await user.save();
      }
    }

    res.json({
      success: true,
      allPassed,
      results,
      pointsAwarded
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { executeSubmission, getExecutionResults, executeCodePlayground, executePublicTestCases, executeChallenge };
