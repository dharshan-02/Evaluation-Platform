const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB. Wiping existing data...');

    // Clear existing data
    await User.deleteMany();
    await Assignment.deleteMany();
    await TestCase.deleteMany();
    await Submission.deleteMany();
    await Notification.deleteMany();
    console.log('✅ Existing data cleared.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@neovika.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Administration',
      isActive: true,
    });

    // 2. Create Faculty
    const faculty1 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.j@neovika.com',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Computer Science',
      isActive: true,
    });

    // 3. Create Student
    const student1 = await User.create({
      name: 'Alex Chen',
      email: 'alex@student.com',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'CS2024001',
      isActive: true
    });

    // 4. Create Assignments
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const a1 = await Assignment.create({
      title: 'Data Structures: Two Sum Problem',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the output as two space-separated integers.',
      course: 'CS201 — Data Structures',
      department: 'Computer Science',
      dueDate: oneWeekFromNow,
      maxMarks: 50,
      allowedLanguages: ['c', 'cpp', 'python', 'java', 'javascript'],
      createdBy: faculty1._id,
      isPublished: true,
      status: 'active',
      autoEvaluate: true,
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.\nO(n) time complexity is expected.',
    });

    const a3 = await Assignment.create({
      title: 'Web Dev: Basic Calculator String Evaluation',
      description: 'Given a string `s` which represents an expression, evaluate this expression and return its value. \nThe integer division should truncate toward zero.\n\nInput: "3+2*2"\nOutput: 7',
      course: 'IT401 — Web Engineering',
      department: 'Information Technology',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      maxMarks: 100,
      allowedLanguages: ['javascript', 'python'],
      createdBy: faculty1._id,
      isPublished: true,
      status: 'active',
      autoEvaluate: true,
      constraints: '1 <= s.length <= 3 * 10^5\ns consists of integers and operators (\'+\', \'-\', \'*\', \'/\') separated by some number of spaces.\ns represents a valid expression.',
    });

    const a4 = await Assignment.create({
      title: 'Algorithms: Merge Intervals',
      description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\nInput: [[1,3],[2,6],[8,10],[15,18]]\nOutput: [[1,6],[8,10],[15,18]]',
      course: 'CS301 — Algorithms',
      department: 'Computer Science',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      maxMarks: 80,
      allowedLanguages: ['c', 'cpp', 'python', 'java', 'javascript'],
      createdBy: faculty1._id,
      isPublished: true,
      status: 'active',
      autoEvaluate: true,
      constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= starti <= endi <= 10^4',
    });

    const a5 = await Assignment.create({
      title: 'System Design: Distributed Cache',
      description: 'Write a detailed design document for a distributed caching system like Redis or Memcached. Describe the architecture, data partitioning strategy (e.g., consistent hashing), replication, and eviction policies (e.g., LRU).',
      course: 'CS402 — System Design',
      department: 'Computer Science',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      maxMarks: 120,
      allowedLanguages: ['python', 'java', 'javascript'],
      createdBy: faculty1._id,
      isPublished: true,
      status: 'active',
      autoEvaluate: false,
      constraints: 'Maximum 2000 words. Include ASCII diagrams if possible.',
    });

    const a6 = await Assignment.create({
      title: 'Data Structures: Valid Parentheses',
      description: 'Given a string `s` containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type of brackets in the correct order.\n\nInput: "()[]{}"\nOutput: true',
      course: 'CS201 — Data Structures',
      department: 'Computer Science',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      maxMarks: 40,
      allowedLanguages: ['c', 'cpp', 'python', 'java', 'javascript'],
      createdBy: faculty1._id,
      isPublished: true,
      status: 'active',
      autoEvaluate: true,
      constraints: '1 <= s.length <= 10^4\ns consists of parentheses only.',
    });

    // 5. Create Test Cases
    await TestCase.insertMany([
      // A1: Two Sum
      { assignment: a1._id, title: 'Example 1', input: '4 9\n2 7 11 15', expectedOutput: '0 1', isHidden: false, order: 1 },
      { assignment: a1._id, title: 'Example 2', input: '3 6\n3 2 4', expectedOutput: '1 2', isHidden: false, order: 2 },
      { assignment: a1._id, title: 'Hidden Case 1', input: '2 6\n3 3', expectedOutput: '0 1', isHidden: true, order: 3 },
      { assignment: a1._id, title: 'Hidden Case 2 (Large)', input: '5 10\n1 2 3 4 5', expectedOutput: '? ?', isHidden: true, order: 4 }, // Mock expected

      // A3: Calculator
      { assignment: a3._id, title: 'Example Addition', input: '1+1', expectedOutput: '2', isHidden: false, order: 1 },
      { assignment: a3._id, title: 'Example Precedence', input: '3+2*2', expectedOutput: '7', isHidden: false, order: 2 },
      { assignment: a3._id, title: 'Hidden Complex', input: ' 3/2 ', expectedOutput: '1', isHidden: true, order: 3 },
      { assignment: a3._id, title: 'Hidden Long', input: ' 3+5 / 2 ', expectedOutput: '5', isHidden: true, order: 4 },

      // A4: Merge Intervals
      { assignment: a4._id, title: 'Example 1', input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', isHidden: false, order: 1 },
      { assignment: a4._id, title: 'Example 2', input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', isHidden: false, order: 2 },
      
      // A6: Valid Parentheses
      { assignment: a6._id, title: 'Example 1', input: '()', expectedOutput: 'true', isHidden: false, order: 1 },
      { assignment: a6._id, title: 'Example 2', input: '()[]{}', expectedOutput: 'true', isHidden: false, order: 2 },
      { assignment: a6._id, title: 'Example 3', input: '(]', expectedOutput: 'false', isHidden: false, order: 3 },
    ]);

    const tcsA1 = await TestCase.find({ assignment: a1._id }).sort({ order: 1 });

    // 6. Create some mock submissions for dashboard visualization
    const sub1 = await Submission.create({
      assignment: a1._id,
      student: student1._id, // Alex
      language: 'python',
      status: 'evaluated',
      marks: 50,
      maxMarks: 50,
      testCasesPassed: 4,
      totalTestCases: 4,
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    });
    
    await Submission.create({
      assignment: a3._id,
      student: student1._id, // Alex
      language: 'javascript',
      status: 'pending',
      submittedAt: new Date(Date.now() - 15 * 60 * 1000) // 15 mins ago
    });

    await Submission.create({
      assignment: a4._id,
      student: student1._id, // Alex
      language: 'python',
      status: 'pending',
      submittedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 mins ago
    });

    await Submission.create({
      assignment: a6._id,
      student: student1._id, // Alex
      language: 'cpp',
      status: 'evaluated',
      marks: 40,
      maxMarks: 40,
      testCasesPassed: 3,
      totalTestCases: 3,
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    });

    const ExecutionResult = require('../models/ExecutionResult');
    const results = [];
    for (const tc of tcsA1) {
      results.push({
        submission: sub1._id,
        testCase: tc._id,
        passed: true,
        actualOutput: tc.expectedOutput,
        executionTime: Math.floor(Math.random() * 20) + 1,
        memoryUsed: 1024 * 1024 * 5,
        error: null,
      });
    }
    await ExecutionResult.insertMany(results);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('  Login credentials:');
    console.log('  Admin:   admin@neovika.com / Admin@123');
    console.log('  Faculty: sarah.j@neovika.com / Faculty@123');
    console.log('  Student: alex@student.com / Student@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:');
    console.error(error);
    process.exit(1);
  }
};

seedData();
