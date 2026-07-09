const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Supports three roles: admin, faculty, student
 * Passwords are automatically hashed before save
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'faculty', 'student'],
        message: 'Role must be admin, faculty, or student',
      },
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department name too long'],
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    points: {
      type: Number,
      default: 0,
    },
    badges: [{
      type: String,
    }],
    completedChallenges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
    }],
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    activityDates: [{
      type: String, // Stored as 'YYYY-MM-DD'
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function () {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return user object without sensitive fields
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
