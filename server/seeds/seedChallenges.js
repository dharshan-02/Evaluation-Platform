require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');

const DB_URI = process.env.MONGODB_URI;

const challenges = [
  // PYTHON PATH (10 Challenges)
  {
    title: 'Python Level 1: Variables & Printing',
    description: 'Print exactly "Hello Python!" to the console without any additional text.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 1,
    points: 10,
    defaultCode: '# Write your code below to print the message\n',
    testCases: [{ input: '', expectedOutput: 'Hello Python!', isHidden: false }]
  },
  {
    title: 'Python Level 2: Arithmetic',
    description: 'Read two integers from standard input, separated by a space. Print their sum.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 2,
    points: 15,
    defaultCode: 'import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) > 0:\n    a, b = map(int, lines[0].split())\n    # Print their sum\n',
    testCases: [{ input: '2 3', expectedOutput: '5', isHidden: false }, { input: '-1 1', expectedOutput: '0', isHidden: true }]
  },
  {
    title: 'Python Level 3: Two Sum Problem',
    description: 'Given an array of integers nums and an integer target, print indices of the two numbers such that they add up to target.\nInput format:\nFirst line: Target number\nSecond line: Space separated integers',
    language: 'python',
    level: 'Intermediate',
    levelNumber: 3,
    points: 25,
    defaultCode: 'def twoSum(nums, target):\n    pass\n\nimport sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    target = int(lines[0])\n    nums = list(map(int, lines[1].split()))\n    res = twoSum(nums, target)\n    if res:\n        print(f"{res[0]} {res[1]}")',
    testCases: [{ input: '9\n2 7 11 15', expectedOutput: '0 1', isHidden: false }, { input: '6\n3 2 4', expectedOutput: '1 2', isHidden: false }]
  },
  {
    title: 'Python Level 4: Palindrome Check',
    description: 'Read a string from input. Print "true" if it is a palindrome, "false" otherwise.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 4,
    points: 15,
    defaultCode: 'import sys\ns = sys.stdin.read().strip()\n# Write your logic\n',
    testCases: [{ input: 'racecar', expectedOutput: 'true', isHidden: false }, { input: 'hello', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'Python Level 5: FizzBuzz',
    description: 'Read an integer N. Print numbers 1 to N. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz", else print the number. Output each on a new line.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 5,
    points: 20,
    defaultCode: 'import sys\nn = int(sys.stdin.read().strip())\n# Write your logic\n',
    testCases: [{ input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false }, { input: '3', expectedOutput: '1\n2\nFizz', isHidden: true }]
  },
  {
    title: 'Python Level 6: Factorial',
    description: 'Read an integer N from input and print its factorial.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 6,
    points: 15,
    defaultCode: 'import sys\nn = int(sys.stdin.read().strip())\n# Write your logic\n',
    testCases: [{ input: '5', expectedOutput: '120', isHidden: false }, { input: '0', expectedOutput: '1', isHidden: false }]
  },
  {
    title: 'Python Level 7: Reverse String',
    description: 'Read a string and print it reversed.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 7,
    points: 10,
    defaultCode: 'import sys\ns = sys.stdin.read().strip()\n# Write your logic\n',
    testCases: [{ input: 'hello', expectedOutput: 'olleh', isHidden: false }, { input: 'world', expectedOutput: 'dlrow', isHidden: true }]
  },
  {
    title: 'Python Level 8: Max in Array',
    description: 'Given space separated integers, print the maximum value.',
    language: 'python',
    level: 'Beginner',
    levelNumber: 8,
    points: 15,
    defaultCode: 'import sys\nnums = list(map(int, sys.stdin.read().split()))\n# Write your logic\n',
    testCases: [{ input: '1 5 3 9 2', expectedOutput: '9', isHidden: false }, { input: '-1 -5 -2', expectedOutput: '-1', isHidden: true }]
  },
  {
    title: 'Python Level 9: Valid Anagram',
    description: 'Given two strings on separate lines, print "true" if they are anagrams of each other, else "false".',
    language: 'python',
    level: 'Intermediate',
    levelNumber: 9,
    points: 25,
    defaultCode: 'import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    s, t = lines[0], lines[1]\n    # Write your logic\n',
    testCases: [{ input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false }, { input: 'rat\ncar', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'Python Level 10: Contains Duplicate',
    description: 'Given space separated integers, print "true" if any value appears at least twice, else "false".',
    language: 'python',
    level: 'Intermediate',
    levelNumber: 10,
    points: 20,
    defaultCode: 'import sys\nnums = list(map(int, sys.stdin.read().split()))\n# Write your logic\n',
    testCases: [{ input: '1 2 3 1', expectedOutput: 'true', isHidden: false }, { input: '1 2 3 4', expectedOutput: 'false', isHidden: false }]
  },

  // JAVASCRIPT PATH (10 Challenges)
  {
    title: 'JS Level 1: Basics',
    description: 'Print "Hello JS" to the console.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 1,
    points: 10,
    defaultCode: 'console.log("Hello JS");',
    testCases: [{ input: '', expectedOutput: 'Hello JS', isHidden: false }]
  },
  {
    title: 'JS Level 2: Valid Parentheses',
    description: 'Given a string s containing brackets, print "true" if valid, "false" otherwise.',
    language: 'javascript',
    level: 'Intermediate',
    levelNumber: 2,
    points: 20,
    defaultCode: 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8").trim();\n// Write your logic\n',
    testCases: [{ input: '()', expectedOutput: 'true', isHidden: false }, { input: '(]', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'JS Level 3: Reverse String',
    description: 'Read a string from standard input and print it reversed.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 3,
    points: 15,
    defaultCode: 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8").trim();\n// Write your logic\n',
    testCases: [{ input: 'hello', expectedOutput: 'olleh', isHidden: false }, { input: 'world', expectedOutput: 'dlrow', isHidden: true }]
  },
  {
    title: 'JS Level 4: Find Max',
    description: 'Given space separated integers, print the maximum value.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 4,
    points: 15,
    defaultCode: 'const fs = require("fs");\nconst nums = fs.readFileSync("/dev/stdin", "utf-8").trim().split(" ").map(Number);\n// Write your logic\n',
    testCases: [{ input: '1 5 3 9 2', expectedOutput: '9', isHidden: false }]
  },
  {
    title: 'JS Level 5: Sum of Array',
    description: 'Given space separated integers, print their sum.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 5,
    points: 15,
    defaultCode: 'const fs = require("fs");\nconst nums = fs.readFileSync("/dev/stdin", "utf-8").trim().split(" ").map(Number);\n// Write your logic\n',
    testCases: [{ input: '1 2 3', expectedOutput: '6', isHidden: false }]
  },
  {
    title: 'JS Level 6: Palindrome',
    description: 'Read a string from input. Print "true" if it is a palindrome, "false" otherwise.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 6,
    points: 15,
    defaultCode: 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8").trim();\n// Write your logic\n',
    testCases: [{ input: 'racecar', expectedOutput: 'true', isHidden: false }, { input: 'hello', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'JS Level 7: FizzBuzz',
    description: 'Read an integer N. Print numbers 1 to N. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz", else print the number. Output each on a new line.',
    language: 'javascript',
    level: 'Beginner',
    levelNumber: 7,
    points: 20,
    defaultCode: 'const fs = require("fs");\nconst n = parseInt(fs.readFileSync("/dev/stdin", "utf-8").trim());\n// Write your logic\n',
    testCases: [{ input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false }]
  },
  {
    title: 'JS Level 8: Anagram',
    description: 'Given two strings on separate lines, print "true" if they are anagrams of each other, else "false".',
    language: 'javascript',
    level: 'Intermediate',
    levelNumber: 8,
    points: 25,
    defaultCode: 'const fs = require("fs");\nconst lines = fs.readFileSync("/dev/stdin", "utf-8").trim().split("\\n");\n// Write your logic\n',
    testCases: [{ input: 'anagram\nnagaram', expectedOutput: 'true', isHidden: false }, { input: 'rat\ncar', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'JS Level 9: First Unique Character',
    description: 'Given a string, find the first non-repeating character and return its index. If it does not exist, return -1.',
    language: 'javascript',
    level: 'Intermediate',
    levelNumber: 9,
    points: 25,
    defaultCode: 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8").trim();\n// Write your logic\n',
    testCases: [{ input: 'leetcode', expectedOutput: '0', isHidden: false }, { input: 'loveleetcode', expectedOutput: '2', isHidden: false }, { input: 'aabb', expectedOutput: '-1', isHidden: true }]
  },
  {
    title: 'JS Level 10: Missing Number',
    description: 'Given an array of size n containing distinct numbers in the range [0, n], print the one number that is missing from the array.',
    language: 'javascript',
    level: 'Intermediate',
    levelNumber: 10,
    points: 25,
    defaultCode: 'const fs = require("fs");\nconst nums = fs.readFileSync("/dev/stdin", "utf-8").trim().split(" ").map(Number);\n// Write your logic\n',
    testCases: [{ input: '3 0 1', expectedOutput: '2', isHidden: false }, { input: '0 1', expectedOutput: '2', isHidden: false }]
  },

  // C PATH (10 Challenges)
  {
    title: 'C Level 1: Fibonacci Sequence',
    description: 'Write a program to print the Nth number in the Fibonacci sequence.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 1,
    points: 10,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 1;\n    // Write your logic\n    return 0;\n}',
    testCases: [{ input: '5', expectedOutput: '5', isHidden: false }, { input: '0', expectedOutput: '0', isHidden: false }]
  },
  {
    title: 'C Level 2: Sum of Two Numbers',
    description: 'Read two integers and print their sum.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 2,
    points: 10,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    if (scanf("%d %d", &a, &b) == 2) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '5 7', expectedOutput: '12', isHidden: false }, { input: '-1 1', expectedOutput: '0', isHidden: true }]
  },
  {
    title: 'C Level 3: Even or Odd',
    description: 'Read an integer. Print "Even" if it is even, "Odd" if it is odd.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 3,
    points: 15,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '4', expectedOutput: 'Even', isHidden: false }, { input: '7', expectedOutput: 'Odd', isHidden: false }]
  },
  {
    title: 'C Level 4: Factorial',
    description: 'Read an integer N and print its factorial.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 4,
    points: 15,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '5', expectedOutput: '120', isHidden: false }, { input: '0', expectedOutput: '1', isHidden: false }]
  },
  {
    title: 'C Level 5: Reverse a String',
    description: 'Read a string and print it reversed.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 5,
    points: 15,
    defaultCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[100];\n    if (scanf("%s", s) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: 'hello', expectedOutput: 'olleh', isHidden: false }]
  },
  {
    title: 'C Level 6: Array Sum',
    description: 'Read an integer N, followed by N integers. Print their sum.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 6,
    points: 15,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '3\n1 2 3', expectedOutput: '6', isHidden: false }]
  },
  {
    title: 'C Level 7: Find Maximum',
    description: 'Read an integer N, followed by N integers. Print the maximum value.',
    language: 'c',
    level: 'Beginner',
    levelNumber: 7,
    points: 15,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '5\n1 9 3 2 5', expectedOutput: '9', isHidden: false }]
  },
  {
    title: 'C Level 8: Prime Number Check',
    description: 'Read an integer N. Print "Prime" if it is prime, otherwise "Not Prime".',
    language: 'c',
    level: 'Intermediate',
    levelNumber: 8,
    points: 20,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '7', expectedOutput: 'Prime', isHidden: false }, { input: '4', expectedOutput: 'Not Prime', isHidden: false }]
  },
  {
    title: 'C Level 9: Palindrome',
    description: 'Read a string. Print "true" if it is a palindrome, otherwise "false".',
    language: 'c',
    level: 'Intermediate',
    levelNumber: 9,
    points: 20,
    defaultCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[100];\n    if (scanf("%s", s) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: 'racecar', expectedOutput: 'true', isHidden: false }, { input: 'hello', expectedOutput: 'false', isHidden: false }]
  },
  {
    title: 'C Level 10: Ascending Sort Check',
    description: 'Read an integer N, followed by N integers. Print "true" if they are in ascending order, else "false".',
    language: 'c',
    level: 'Intermediate',
    levelNumber: 10,
    points: 25,
    defaultCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) == 1) {\n        // Write your logic\n    }\n    return 0;\n}',
    testCases: [{ input: '4\n1 2 3 4', expectedOutput: 'true', isHidden: false }, { input: '4\n1 3 2 4', expectedOutput: 'false', isHidden: false }]
  }
];

const seedChallenges = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    
    console.log('Clearing existing challenges...');
    await Challenge.deleteMany({});
    
    console.log('Inserting sample challenges...');
    await Challenge.insertMany(challenges);
    
    console.log('Challenges seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding challenges:', error);
    process.exit(1);
  }
};

seedChallenges();
