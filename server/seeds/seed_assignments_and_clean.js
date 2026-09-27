const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Models
const Assignment = require('../models/Assignment');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const ExecutionResult = require('../models/ExecutionResult');
const PlagiarismReport = require('../models/PlagiarismReport');
const Notification = require('../models/Notification');
const User = require('../models/User');

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evaluationhub');
    console.log('Connected to MongoDB');

    console.log('Removing old data...');
    await Assignment.deleteMany();
    await TestCase.deleteMany();
    await Submission.deleteMany();
    await ExecutionResult.deleteMany();
    await PlagiarismReport.deleteMany();
    await Notification.deleteMany();
    console.log('Old data removed successfully.');

    // Get an admin or faculty user to be the creator
    let faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      faculty = await User.findOne({ role: 'admin' });
      if (!faculty) {
          faculty = await User.create({
              name: 'Dr. John Doe',
              email: 'john.doe@university.edu',
              password: 'password123',
              role: 'faculty',
              department: 'Computer Science'
          });
      }
    }

    console.log(`Using user ${faculty.email} as the assignment creator.`);

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const assignmentsToCreate = [
      {
        title: 'Data Structures: Binary Search Tree (Preorder Traversal)',
        description: 'You are given `N` integers. Insert them into a Binary Search Tree (BST) in the given order. After inserting all elements, print the **Preorder Traversal** of the tree.\n\n### Input Format:\n- The first line contains an integer `N` (number of nodes).\n- The second line contains `N` space-separated integers.\n\n### Output Format:\n- A single line containing `N` space-separated integers representing the preorder traversal.',
        constraints: '1 <= N <= 10^4\n-10^5 <= Node Value <= 10^5',
        course: 'CS201 Data Structures',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 100,
        allowedLanguages: ['cpp', 'java', 'c'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      },
      {
        title: 'Algorithms: 0/1 Knapsack',
        description: 'Given `N` items where each item has some weight and profit associated with it, and a knapsack of capacity `W`. Find the maximum profit that can be earned such that the total weight of the items is less than or equal to `W`.\n\n### Input Format:\n- First line: `N` (number of items) and `W` (capacity of knapsack).\n- Second line: `N` space-separated integers denoting the weights.\n- Third line: `N` space-separated integers denoting the profits.\n\n### Output Format:\n- A single integer denoting the maximum profit.',
        constraints: '1 <= N <= 1000\n1 <= W <= 100000\n1 <= Weight[i] <= 1000\n1 <= Profit[i] <= 1000',
        course: 'CS301 Algorithms',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 150,
        allowedLanguages: ['python', 'c', 'cpp', 'java'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      },
      {
        title: 'Logic: Valid Parentheses',
        description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\n### Input Format:\n- A single string `s`.\n\n### Output Format:\n- Print `true` if valid, otherwise `false`.',
        constraints: '1 <= s.length <= 10^4\n`s` consists of parentheses only `()[]{}`.',
        course: 'CS101 Intro to Logic',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 50,
        allowedLanguages: ['javascript', 'python', 'cpp', 'java'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      },
      {
        title: 'Mathematics: Matrix Multiplication',
        description: 'Given two matrices `A` (of size M x N) and `B` (of size N x P), compute their product matrix `C` (of size M x P).\n\n### Input Format:\n- First line: `M`, `N`, `P`.\n- Next `M` lines: `N` space-separated integers for matrix A.\n- Next `N` lines: `P` space-separated integers for matrix B.\n\n### Output Format:\n- `M` lines, each containing `P` space-separated integers representing matrix C.',
        constraints: '1 <= M, N, P <= 100\n-1000 <= Matrix elements <= 1000',
        course: 'CS202 Linear Algebra',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 100,
        allowedLanguages: ['c', 'cpp', 'java', 'python'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      },
      {
        title: 'Strings: Longest Substring Without Repeating Characters',
        description: 'Given a string `s`, find the length of the longest substring without repeating characters.\n\n### Input Format:\n- A single string `s` on one line.\n\n### Output Format:\n- A single integer representing the length of the longest valid substring.',
        constraints: '0 <= s.length <= 5 * 10^4\n`s` consists of English letters, digits, symbols and spaces.',
        course: 'CS301 Algorithms',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 120,
        allowedLanguages: ['python', 'java', 'javascript', 'cpp'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      },
      {
        title: 'Graphs: Dijkstra\'s Shortest Path',
        description: 'Given a weighted, undirected graph with `V` vertices and `E` edges. Find the shortest distance of all vertices from the source vertex `0`.\n\n### Input Format:\n- First line: `V` (vertices) and `E` (edges).\n- Next `E` lines: Three integers `u`, `v`, `w` denoting an edge between `u` and `v` with weight `w`.\n\n### Output Format:\n- A single line containing `V` space-separated integers denoting the shortest distance from vertex 0 to vertex 0, 1, 2, ..., V-1. (Use -1 if unreachable).',
        constraints: '1 <= V <= 1000\n0 <= E <= 100000\n1 <= w <= 1000',
        course: 'CS405 Graph Theory',
        department: 'Computer Science',
        dueDate: threeMonthsFromNow,
        maxMarks: 200,
        allowedLanguages: ['go', 'rust', 'cpp', 'java', 'python'],
        createdBy: faculty._id,
        status: 'active',
        isPublished: true
      }
    ];

    console.log('Seeding 6 new assignments...');
    const insertedAssignments = await Assignment.insertMany(assignmentsToCreate);
    
    // Create detailed test cases for each assignment
    const testCasesToCreate = [];

    // 1. BST
    testCasesToCreate.push(
      { assignment: insertedAssignments[0]._id, title: 'Sample Case 1', input: '6\n5 3 7 2 4 6', expectedOutput: '5 3 2 4 7 6', isHidden: false, weight: 20 },
      { assignment: insertedAssignments[0]._id, title: 'Hidden Ascending Order', input: '5\n1 2 3 4 5', expectedOutput: '1 2 3 4 5', isHidden: true, weight: 40 },
      { assignment: insertedAssignments[0]._id, title: 'Hidden Descending Order', input: '5\n5 4 3 2 1', expectedOutput: '5 4 3 2 1', isHidden: true, weight: 40 }
    );

    // 2. Knapsack
    testCasesToCreate.push(
      { assignment: insertedAssignments[1]._id, title: 'Sample Case 1', input: '3 50\n10 20 30\n60 100 120', expectedOutput: '220', isHidden: false, weight: 30 },
      { assignment: insertedAssignments[1]._id, title: 'Sample Case 2', input: '4 5\n1 2 3 2\n8 4 0 5', expectedOutput: '13', isHidden: false, weight: 30 },
      { assignment: insertedAssignments[1]._id, title: 'Hidden Zero Capacity', input: '5 0\n1 2 3 4 5\n10 20 30 40 50', expectedOutput: '0', isHidden: true, weight: 40 },
      { assignment: insertedAssignments[1]._id, title: 'Hidden Large Weights', input: '2 10\n20 30\n100 200', expectedOutput: '0', isHidden: true, weight: 50 }
    );

    // 3. Valid Parentheses
    testCasesToCreate.push(
      { assignment: insertedAssignments[2]._id, title: 'Basic Valid', input: '()', expectedOutput: 'true', isHidden: false, weight: 10 },
      { assignment: insertedAssignments[2]._id, title: 'Basic Valid Multiple', input: '()[]{}', expectedOutput: 'true', isHidden: false, weight: 10 },
      { assignment: insertedAssignments[2]._id, title: 'Invalid Mismatch', input: '(]', expectedOutput: 'false', isHidden: false, weight: 10 },
      { assignment: insertedAssignments[2]._id, title: 'Hidden Nested', input: '{[()()]}', expectedOutput: 'true', isHidden: true, weight: 10 },
      { assignment: insertedAssignments[2]._id, title: 'Hidden Unbalanced', input: '((()', expectedOutput: 'false', isHidden: true, weight: 10 }
    );

    // 4. Matrix Multiplication
    testCasesToCreate.push(
      { assignment: insertedAssignments[3]._id, title: '2x2 Matrices', input: '2 2 2\n1 2\n3 4\n5 6\n7 8', expectedOutput: '19 22\n43 50', isHidden: false, weight: 20 },
      { assignment: insertedAssignments[3]._id, title: 'Identity Matrix', input: '3 3 3\n1 0 0\n0 1 0\n0 0 1\n5 6 7\n8 9 10\n11 12 13', expectedOutput: '5 6 7\n8 9 10\n11 12 13', isHidden: false, weight: 30 },
      { assignment: insertedAssignments[3]._id, title: 'Hidden Rectangular', input: '2 3 2\n1 2 3\n4 5 6\n7 8\n9 10\n11 12', expectedOutput: '58 64\n139 154', isHidden: true, weight: 50 }
    );

    // 5. Longest Substring
    testCasesToCreate.push(
      { assignment: insertedAssignments[4]._id, title: 'Sample 1', input: 'abcabcbb', expectedOutput: '3', isHidden: false, weight: 20 },
      { assignment: insertedAssignments[4]._id, title: 'Sample 2', input: 'bbbbb', expectedOutput: '1', isHidden: false, weight: 20 },
      { assignment: insertedAssignments[4]._id, title: 'Sample 3', input: 'pwwkew', expectedOutput: '3', isHidden: false, weight: 20 },
      { assignment: insertedAssignments[4]._id, title: 'Hidden Empty', input: '', expectedOutput: '0', isHidden: true, weight: 30 },
      { assignment: insertedAssignments[4]._id, title: 'Hidden Symbols', input: ' !@#$%^&*()', expectedOutput: '11', isHidden: true, weight: 30 }
    );

    // 6. Dijkstra
    testCasesToCreate.push(
      { assignment: insertedAssignments[5]._id, title: 'Basic Graph', input: '4 4\n0 1 1\n1 2 2\n2 3 1\n0 3 5', expectedOutput: '0 1 3 4', isHidden: false, weight: 50 },
      { assignment: insertedAssignments[5]._id, title: 'Disconnected Graph', input: '3 1\n1 2 5', expectedOutput: '0 -1 -1', isHidden: false, weight: 50 },
      { assignment: insertedAssignments[5]._id, title: 'Hidden Complex', input: '5 6\n0 1 2\n0 2 4\n1 2 1\n1 3 7\n2 4 3\n3 4 2', expectedOutput: '0 2 3 8 6', isHidden: true, weight: 100 }
    );

    console.log('Seeding detailed test cases...');
    await TestCase.insertMany(testCasesToCreate);

    console.log('Successfully seeded 6 new assignments with descriptions, constraints, and rich testcases!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
