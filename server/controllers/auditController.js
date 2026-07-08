const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by action if provided
    if (req.query.action) {
      query.action = req.query.action;
    }

    // Filter by user if provided
    if (req.query.user) {
      query.user = req.query.user;
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
  }
};

module.exports = {
  getAuditLogs
};
