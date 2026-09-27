const Submission = require('../models/Submission');

/**
 * Service to run static analysis on source code to determine code quality.
 * In a real production system, this would spawn a Docker container with
 * tools like ESLint, Pylint, Checkstyle, or SonarQube Scanner.
 * For this implementation, we will simulate the extraction of metrics
 * and generate a realistic Code Quality Score.
 */
class StaticAnalysisService {
  /**
   * Run static analysis on a submission's files
   * @param {ObjectId} submissionId 
   */
  async analyzeSubmission(submissionId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission || !submission.files || submission.files.length === 0) {
        return null;
      }

      // Simulate analysis logic based on language and file content length/complexity
      let totalComplexity = 0;
      let totalSmells = 0;
      let issues = [];

      submission.files.forEach((file) => {
        const content = file.content || '';
        const lines = content.split('\n');
        
        // Very basic heuristics for simulation
        const isLongFile = lines.length > 200;
        const hasManyConditions = (content.match(/(if|else if|switch|case|while|for)/g) || []).length;
        const hasConsoleLogs = (content.match(/console\.log|print|System\.out\.println/g) || []).length;

        if (isLongFile) {
          totalSmells += 2;
          issues.push({ file: file.name, message: 'File is too long, consider splitting into smaller modules.', severity: 'warning' });
        }

        if (hasManyConditions > 15) {
          totalComplexity += hasManyConditions;
          issues.push({ file: file.name, message: 'High cyclomatic complexity detected. Refactor nested conditions.', severity: 'error' });
        }

        if (hasConsoleLogs > 0) {
          totalSmells += hasConsoleLogs;
          issues.push({ file: file.name, message: 'Leftover debugging print statements detected.', severity: 'info' });
        }
      });

      // Calculate score (100 is perfect, subtract for complexity and smells)
      let score = 100 - (totalComplexity * 2) - (totalSmells * 3);
      if (score < 0) score = 0;
      if (score > 100) score = 100;

      const report = {
        score,
        metrics: {
          cyclomaticComplexity: totalComplexity,
          codeSmells: totalSmells,
          duplications: '0.0%', // Simulated
        },
        issues,
        analyzedAt: new Date(),
      };

      submission.codeQualityScore = score;
      submission.staticAnalysisReport = report;
      await submission.save();

      return report;
    } catch (error) {
      console.error('Static Analysis Error:', error);
      return null;
    }
  }
}

module.exports = new StaticAnalysisService();
