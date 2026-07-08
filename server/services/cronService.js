const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const { getIO } = require('../socket');

const initCronService = () => {
  console.log('⏰ Starting Cron Service...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // TASK 1: Close expired assignments
      const expiredAssignments = await Assignment.find({
        status: 'active',
        dueDate: { $lte: now }
      });

      if (expiredAssignments.length > 0) {
        for (const assignment of expiredAssignments) {
          assignment.status = 'closed';
          await assignment.save();
          console.log(`🔒 Assignment closed: ${assignment.title}`);
        }
        
        // Notify clients to refresh dashboard
        try {
          getIO().emit('dashboard:update');
        } catch (err) {}
      }

      // TASK 2: Send 1-hour reminders
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      
      const assignmentsNeedingReminder = await Assignment.find({
        status: 'active',
        reminderSent: false,
        dueDate: { $gt: now, $lte: oneHourFromNow }
      });

      if (assignmentsNeedingReminder.length > 0) {
        for (const assignment of assignmentsNeedingReminder) {
          console.log(`⏰ Sending 1-hour reminders for: ${assignment.title}`);
          
          // Find students in the same department
          const query = { role: 'student' };
          if (assignment.department) {
            query.department = assignment.department;
          }
          const students = await User.find(query);

          for (const student of students) {
            // 1. Create in-app notification
            const notif = await Notification.create({
              user: student._id,
              title: 'Assignment Deadline Approaching',
              message: `Your assignment "${assignment.title}" is due in less than 1 hour!`,
              type: 'assignment',
              link: `/assignments/${assignment._id}`
            });

            // Push real-time notification
            try {
              getIO().to(String(student._id)).emit('notification:new', notif);
            } catch (err) {}

            // 2. Send email
            try {
              await sendEmail({
                to: student.email,
                subject: `URGENT: ${assignment.title} is due in 1 hour`,
                text: `Hello ${student.name},\n\nThis is a friendly reminder that your assignment "${assignment.title}" is due in less than 1 hour.\n\nPlease submit your work before the deadline to avoid penalties.\n\nBest,\nNeo-Vika Team`,
                html: `<p>Hello ${student.name},</p><p>This is a friendly reminder that your assignment <strong>${assignment.title}</strong> is due in less than 1 hour.</p><p>Please submit your work before the deadline to avoid penalties.</p><p>Best,<br>Neo-Vika Team</p>`
              });
            } catch (emailErr) {
              console.error(`Failed to send email to ${student.email}:`, emailErr.message);
            }
          }

          // Mark as reminder sent
          assignment.reminderSent = true;
          await assignment.save();
        }
      }
    } catch (error) {
      console.error('❌ Error in cron service:', error);
    }
  });
};

module.exports = { initCronService };
