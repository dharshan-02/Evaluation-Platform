const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry
 * 
 * @param {Object} req - Express request object (to extract user, IP, User-Agent)
 * @param {String} action - Identifier for the action (e.g. 'LOGIN_SUCCESS', 'ASSIGNMENT_CREATED')
 * @param {String} details - Human readable summary of the action
 * @param {Object} metadata - Optional JSON metadata (e.g. before/after states)
 * @param {String} targetResource - Optional ID of the affected resource
 * @param {String} resourceModel - Optional Name of the affected resource model (e.g. 'User')
 */
const logAction = async (req, action, details, metadata = {}, targetResource = null, resourceModel = null) => {
  try {
    let userId = null;
    
    if (req && req.user && req.user._id) {
      userId = req.user._id;
    } else if (req && req.userId) {
      userId = req.userId;
    }

    // Try extracting from body if it's a failed login and user is not set
    if (!userId && req && req.body && req.body.email) {
      metadata.attemptedEmail = req.body.email;
    }

    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
      userAgent = req.headers['user-agent'] || null;
    }

    const auditEntry = new AuditLog({
      action,
      user: userId,
      targetResource,
      resourceModel,
      details,
      ipAddress,
      userAgent,
      metadata
    });

    await auditEntry.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Do not throw error so it doesn't break the main flow
  }
};

module.exports = {
  logAction
};
