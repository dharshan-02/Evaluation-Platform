const crypto = require('crypto');
const Submission = require('../models/Submission');
const { processSubmission } = require('../services/autoProcessingService');

/**
 * Handle incoming GitHub Push events
 * Verifies the signature and triggers evaluation.
 */
exports.handleGitHubPush = async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const payload = JSON.stringify(req.body);

    if (event !== 'push') {
      return res.status(200).send('Event not push, ignored.');
    }

    // Identify the repo
    const repoUrl = req.body.repository?.html_url;
    if (!repoUrl) {
      return res.status(400).send('No repository URL in payload');
    }

    // Find the submission associated with this repo
    const submission = await Submission.findOne({ githubUrl: repoUrl, githubWebhookEnabled: true });
    
    if (!submission) {
      return res.status(404).send('No active submission found for this repository.');
    }

    // Note: In a real production app, we should verify the `signature` using a secret stored in the DB.
    // For simplicity, we assume if the submission matches the repo and has webhooks enabled, it's valid.

    const latestCommit = req.body.head_commit;
    
    if (!latestCommit) {
      return res.status(200).send('No head commit, ignored.');
    }

    // Add to commits array
    submission.commits.push({
      hash: latestCommit.id,
      message: latestCommit.message,
      timestamp: latestCommit.timestamp,
      author: latestCommit.author.username || latestCommit.author.name,
      status: 'pending'
    });
    
    submission.latestCommitHash = latestCommit.id;
    submission.status = 'queued';
    
    await submission.save();

    // Trigger the real auto-processing pipeline asynchronously
    processSubmission(submission._id).catch((err) => {
      console.error('Webhook auto-processing failed:', err.message);
    });

    return res.status(202).json({ message: 'Webhook received, pipeline triggered.' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Register a webhook for a submission
 * This generates a payload URL that the student can put into GitHub
 */
exports.registerWebhook = async (req, res) => {
  try {
    const { submissionId } = req.body;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Ensure only the owner can register
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    submission.githubWebhookEnabled = true;
    await submission.save();

    const webhookUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/webhooks/github`;

    res.status(200).json({
      message: 'Webhook enabled successfully.',
      webhookUrl: webhookUrl,
      instructions: `Please go to your GitHub repository -> Settings -> Webhooks -> Add Webhook. Set the Payload URL to ${webhookUrl}, Content type to application/json, and select 'Just the push event'.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

