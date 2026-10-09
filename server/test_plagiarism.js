const { compareSubmissions } = require('./services/plagiarismService');

console.log('Testing Plagiarism Engine (Winnowing Algorithm)...\n');

const code1 = `
function calculateSum(array) {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum;
}
console.log(calculateSum([1, 2, 3]));
`;

// Same logic, different variable names and formatting
const code2 = `
function getTotal(arr) {
  let total = 0; // initialize
  for (let idx = 0; idx < arr.length; idx++) {
    total = total + arr[idx];
  }
  return total;
}
console.log(getTotal([1, 2, 3]));
`;

// Completely different logic
const code3 = `
function greet(name) {
  console.log("Hello, " + name);
}
greet("World");
`;

console.log('--- Test 1: Highly Similar Code ---');
const result1 = compareSubmissions(code1, code2, 'javascript');
console.log(`Similarity Score: ${result1.similarityScore}%`);
console.log(`Textual Score: ${result1.textualScore}%`);
console.log(`Structural Score: ${result1.structuralScore}%`);
console.log(`Common Fingerprints: ${result1.commonFingerprintsCount}`);

console.log('\n--- Test 2: Completely Different Code ---');
const result2 = compareSubmissions(code1, code3, 'javascript');
console.log(`Similarity Score: ${result2.similarityScore}%`);
console.log(`Textual Score: ${result2.textualScore}%`);
console.log(`Structural Score: ${result2.structuralScore}%`);
console.log(`Common Fingerprints: ${result2.commonFingerprintsCount}`);

if (result1.similarityScore > 70 && result2.similarityScore < 20) {
  console.log('\n✅ Plagiarism engine is working as expected.');
} else {
  console.log('\n❌ Plagiarism engine might not be working correctly.');
}
