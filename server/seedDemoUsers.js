require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const demoUsers = [
  { name: 'Admin', email: 'admin@neovika.com', password: 'Admin@123', role: 'admin' },
  { name: 'Sarah', email: 'sarah.j@neovika.com', password: 'Faculty@123', role: 'faculty' },
  { name: 'Alex', email: 'alex@student.com', password: 'Student@123', role: 'student' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const user of demoUsers) {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create(user);
        console.log(`Created user: ${user.email}`);
      } else {
        // Update password if exists
        existing.password = user.password;
        await existing.save();
        console.log(`Updated user password: ${user.email}`);
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
