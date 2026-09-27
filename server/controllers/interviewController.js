const Interview = require('../models/Interview');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const socket = require('../socket');

// @desc    Get all interview slots for an assignment
// @route   GET /api/assignments/:assignmentId/interviews
// @access  Private
exports.getInterviewsByAssignment = async (req, res, next) => {
  try {
    let query = { assignment: req.params.assignmentId };
    
    // If student, only show 'open' slots or slots booked by them
    if (req.user.role === 'student') {
      query.$or = [
        { status: 'open' },
        { student: req.user.id }
      ];
    } else {
      // Faculty only sees their own slots unless admin
      if (req.user.role !== 'admin') {
        query.faculty = req.user.id;
      }
    }

    const interviews = await Interview.find(query)
      .populate('faculty', 'name email')
      .populate('student', 'name email')
      .sort({ startTime: 1 });
      
    res.json({ success: true, interviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Create interview slots
// @route   POST /api/assignments/:assignmentId/interviews
// @access  Faculty/Admin
exports.createInterviewSlots = async (req, res, next) => {
  try {
    const { slots } = req.body; // Array of { startTime, endTime, meetingLink }
    
    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({ success: false, message: 'Invalid slots data' });
    }

    const createdSlots = await Promise.all(
      slots.map(slot => 
        Interview.create({
          assignment: req.params.assignmentId,
          faculty: req.user.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          meetingLink: slot.meetingLink,
          status: 'open'
        })
      )
    );

    res.status(201).json({ success: true, count: createdSlots.length, slots: createdSlots });
  } catch (error) {
    next(error);
  }
};

// @desc    Book an interview slot
// @route   POST /api/interviews/:id/book
// @access  Student
exports.bookInterview = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can book slots' });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    if (interview.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Slot is already booked or unavailable' });
    }

    // Check if student already booked a slot for this assignment
    const existing = await Interview.findOne({ 
      assignment: interview.assignment, 
      student: req.user.id,
      status: 'booked'
    });
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already booked a slot for this assignment' });
    }

    interview.student = req.user.id;
    interview.status = 'booked';
    await interview.save();

    // Notify faculty
    const notif = await Notification.create({
      user: interview.faculty,
      title: 'Interview Booked',
      message: `A student booked a viva slot for ${new Date(interview.startTime).toLocaleString()}`,
      type: 'info',
    });
    try {
      socket.getIO().to(String(interview.faculty)).emit('notification:new', notif);
    } catch(e) {}

    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an interview
// @route   POST /api/interviews/:id/cancel
// @access  Private
exports.cancelInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Student canceling their own
    if (req.user.role === 'student') {
      if (interview.student?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      interview.student = null;
      interview.status = 'open';
    } else {
      // Faculty canceling
      if (interview.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      interview.status = 'cancelled';
    }

    await interview.save();
    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};
