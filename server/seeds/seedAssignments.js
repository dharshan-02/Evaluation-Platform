require('dotenv').config();
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const TestCase = require('../models/TestCase');
const User = require('../models/User');

const DB_URI = process.env.MONGODB_URI;

const assignmentsData = [
  {
    title: 'Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: '- `2 <= nums.length <= 10^4`\n- `-10^9 <= nums[i] <= 10^9`\n- `-10^9 <= target <= 10^9`\n- Only one valid answer exists.',
    course: 'Data Structures and Algorithms',
    department: 'Computer Science',
    maxMarks: 100,
    isPublished: true,
    status: 'active',
    testCases: [
      {
        title: 'Sample Case 1',
        input: '4\n2 7 11 15\n9',
        expectedOutput: '0 1',
        isHidden: false,
        weight: 10
      },
      {
        title: 'Sample Case 2',
        input: '3\n3 2 4\n6',
        expectedOutput: '1 2',
        isHidden: false,
        weight: 10
      },
      {
        title: 'Hidden Case 1',
        input: '2\n3 3\n6',
        expectedOutput: '0 1',
        isHidden: true,
        weight: 40
      },
      {
        title: 'Hidden Case 2',
        input: '5\n1 5 10 15 20\n25',
        expectedOutput: '2 3',
        isHidden: true,
        weight: 40
      }
    ]
  },
  {
    title: 'Valid Parentheses',
    description: 'Given a string `s` containing just the characters `\'(\'`, `\')\'`, `\'{\'`, `\'}\'`, `\'[\'` and `\']\'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    constraints: '- `1 <= s.length <= 10^4`\n- `s` consists of parentheses only `\'()[]{}\'`.',
    course: 'Data Structures and Algorithms',
    department: 'Computer Science',
    maxMarks: 100,
    isPublished: true,
    status: 'active',
    testCases: [
      {
        title: 'Sample Case 1',
        input: '()',
        expectedOutput: 'true',
        isHidden: false,
        weight: 10
      },
      {
        title: 'Sample Case 2',
        input: '()[]{}',
        expectedOutput: 'true',
        isHidden: false,
        weight: 10
      },
      {
        title: 'Hidden Case 1',
        input: '(]',
        expectedOutput: 'false',
        isHidden: true,
        weight: 40
      },
      {
        title: 'Hidden Case 2',
        input: '([)]',
        expectedOutput: 'false',
        isHidden: true,
        weight: 40
      }
    ]
  },
  {
    title: 'Merge Intervals',
    description: 'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.\n\n**Input Format**\nFirst line contains `n` (number of intervals).\nNext `n` lines contain two space-separated integers `start` and `end`.',
    constraints: '- `1 <= intervals.length <= 10^4`\n- `intervals[i].length == 2`\n- `0 <= starti <= endi <= 10^4`',
    course: 'Data Structures and Algorithms',
    department: 'Computer Science',
    maxMarks: 100,
    isPublished: true,
    status: 'active',
    testCases: [
      {
        title: 'Sample Case 1',
        input: '4\n1 3\n2 6\n8 10\n15 18',
        expectedOutput: '1 6\n8 10\n15 18',
        isHidden: false,
        weight: 20
      },
      {
        title: 'Sample Case 2',
        input: '2\n1 4\n4 5',
        expectedOutput: '1 5',
        isHidden: false,
        weight: 20
      },
      {
        title: 'Hidden Case 1',
        input: '3\n1 4\n0 4\n5 6',
        expectedOutput: '0 4\n5 6',
        isHidden: true,
        weight: 60
      }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    constraints: '- `0 <= s.length <= 5 * 10^4`\n- `s` consists of English letters, digits, symbols and spaces.',
    course: 'Data Structures and Algorithms',
    department: 'Computer Science',
    maxMarks: 100,
    isPublished: true,
    status: 'active',
    testCases: [
      {
        title: 'Sample Case 1',
        input: 'abcabcbb',
        expectedOutput: '3',
        isHidden: false,
        weight: 15
      },
      {
        title: 'Sample Case 2',
        input: 'bbbbb',
        expectedOutput: '1',
        isHidden: false,
        weight: 15
      },
      {
        title: 'Hidden Case 1',
        input: 'pwwkew',
        expectedOutput: '3',
        isHidden: true,
        weight: 35
      },
      {
        title: 'Hidden Case 2',
        input: '',
        expectedOutput: '0',
        isHidden: true,
        weight: 35
      }
    ]
  },
  {
    title: 'Climbing Stairs',
    description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    constraints: '- `1 <= n <= 45`',
    course: 'Data Structures and Algorithms',
    department: 'Computer Science',
    maxMarks: 100,
    isPublished: true,
    status: 'active',
    testCases: [
      {
        title: 'Sample Case 1',
        input: '2',
        expectedOutput: '2',
        isHidden: false,
        weight: 20
      },
      {
        title: 'Sample Case 2',
        input: '3',
        expectedOutput: '3',
        isHidden: false,
        weight: 20
      },
      {
        title: 'Hidden Case 1',
        input: '4',
        expectedOutput: '5',
        isHidden: true,
        weight: 30
      },
      {
        title: 'Hidden Case 2',
        input: '5',
        expectedOutput: '8',
        isHidden: true,
        weight: 30
      }
    ]
  }
];

const seedAssignments = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    
    console.log('Clearing existing assignments and test cases...');
    await Assignment.deleteMany({});
    await TestCase.deleteMany({});
    
    // Find a faculty user to attach the assignments to
    let facultyUser = await User.findOne({ role: 'faculty' });
    if (!facultyUser) {
      console.log('No faculty user found. Creating a default faculty user...');
      facultyUser = await User.create({
        name: 'John Faculty',
        email: 'faculty@example.com',
        password: 'password123',
        role: 'faculty',
        department: 'Computer Science'
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    console.log('Inserting new assignments...');
    
    for (const assignmentData of assignmentsData) {
      const { testCases, ...assignmentDetails } = assignmentData;
      
      const assignment = await Assignment.create({
        ...assignmentDetails,
        createdBy: facultyUser._id,
        dueDate: dueDate
      });

      if (testCases && testCases.length > 0) {
        const testCasesWithAssignmentId = testCases.map((tc, index) => ({
          ...tc,
          assignment: assignment._id,
          order: index
        }));
        
        await TestCase.insertMany(testCasesWithAssignmentId);
      }
      
      console.log(`Created assignment: ${assignment.title} with ${testCases.length} test cases.`);
    }
    
    console.log('Assignments seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding assignments:', error);
    process.exit(1);
  }
};

seedAssignments();
