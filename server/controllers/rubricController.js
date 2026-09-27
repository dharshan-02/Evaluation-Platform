const Rubric = require('../models/Rubric');
const Assignment = require('../models/Assignment');

// @desc    Get rubric for an assignment
// @route   GET /api/assignments/:assignmentId/rubric
// @access  Private
exports.getRubricByAssignment = async (req, res, next) => {
  try {
    const rubric = await Rubric.findOne({ assignment: req.params.assignmentId });
    if (!rubric) {
      return res.status(404).json({ success: false, message: 'Rubric not found' });
    }
    res.json({ success: true, rubric });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update rubric for an assignment
// @route   POST /api/assignments/:assignmentId/rubric
// @access  Private (Faculty/Admin)
exports.upsertRubric = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid rubric items' });
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    let rubric = await Rubric.findOne({ assignment: req.params.assignmentId });

    if (rubric) {
      rubric.items = items;
      await rubric.save();
    } else {
      rubric = await Rubric.create({
        assignment: req.params.assignmentId,
        createdBy: req.user.id,
        items,
      });
    }

    res.json({ success: true, rubric });
  } catch (error) {
    next(error);
  }
};
