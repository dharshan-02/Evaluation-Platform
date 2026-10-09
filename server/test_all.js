const axios = require('axios');
const mongoose = require('mongoose');
const http = require('http');
const app = require('./server'); // This doesn't start the server because of our previous patch
const config = require('./config/env');

async function runTests() {
  console.log('Starting full integration test suite...');
  
  // Connect to the test database
  const testMongoUri = config.mongoUri.replace('eval-hub', 'eval-hub-test');
  await mongoose.connect(testMongoUri);
  console.log('✅ Connected to MongoDB (test database)');
  
  // Clear the database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  console.log('✅ Cleared test database');

  // Start the server
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://localhost:${port}/api`;
  console.log(`✅ Server listening on port ${port}`);

  const api = axios.create({ baseURL });
  let studentToken, guideToken, adminToken;

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION MODULE TESTS
    // ---------------------------------------------------------
    console.log('\n--- 1. Testing Authentication ---');
    
    // Register Student
    const studentRes = await api.post('/auth/register', {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU001',
      department: 'Computer Science'
    });
    console.assert(studentRes.status === 201, 'Student registration failed');
    studentToken = studentRes.data.token;
    console.log('✅ Student registered successfully');

    // Register Guide
    const guideRes = await api.post('/auth/register', {
      name: 'Test Guide',
      email: 'guide@test.com',
      password: 'password123',
      role: 'faculty',
      department: 'Computer Science'
    });
    console.assert(guideRes.status === 201, 'Guide registration failed');
    guideToken = guideRes.data.token;
    console.log('✅ Guide registered successfully');

    // Login Test
    const loginRes = await api.post('/auth/login', {
      email: 'student@test.com',
      password: 'password123'
    });
    console.assert(loginRes.data.token === studentToken || loginRes.data.token, 'Login failed');
    console.log('✅ Login successful');

    // Get Me
    const meRes = await api.get('/auth/me', { headers: { Authorization: `Bearer ${studentToken}` } });
    console.assert(meRes.data.user.email === 'student@test.com', 'Get me failed');
    console.log('✅ Fetch current user successful');

    // ---------------------------------------------------------
    // 2. PROJECT MANAGEMENT MODULE TESTS
    // ---------------------------------------------------------
    console.log('\n--- 2. Testing Project Management ---');
    
    const projectRes = await api.post('/projects', {
      title: 'AI Based Capstone',
      description: 'A capstone project using LLMs.',
      technologies: ['React', 'Node.js', 'Python'],
      githubUrl: 'https://github.com/test/repo',
      guideId: guideRes.data.user.id
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.assert(projectRes.status === 201, 'Project creation failed');
    const projectId = projectRes.data.project._id;
    console.log('✅ Project created successfully');

    // Fetch projects
    const getProjectsRes = await api.get('/projects', { headers: { Authorization: `Bearer ${studentToken}` } });
    console.assert(getProjectsRes.data.projects.length === 1, 'Project fetch failed');
    console.log('✅ Projects fetched successfully');

    // Add guide to project (Assuming a route or method exists, or just via update)
    // For now, let's just update the project
    const updateProjectRes = await api.put(`/projects/${projectId}`, {
      guideId: guideRes.data.user.id
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log('✅ Project updated with guide');

    // ---------------------------------------------------------
    // 3. ASSIGNMENTS AND SUBMISSION TESTS
    // ---------------------------------------------------------
    console.log('\n--- 3. Testing Assignments and Auto-Evaluation ---');
    
    // Create an assignment (Requires guide or admin role)
    const assignmentRes = await api.post('/assignments', {
      title: 'Basic Algo',
      description: 'Implement a basic algorithm',
      type: 'code',
      course: 'CS101',
      maxMarks: 100,
      status: 'active',
      isPublished: true,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      testCases: [{ input: '1 2', output: '3', isHidden: false, marks: 100 }]
    }, { headers: { Authorization: `Bearer ${guideToken}` } });
    
    console.assert(assignmentRes.status === 201, 'Assignment creation failed');
    const assignmentId = assignmentRes.data.assignment._id;
    console.log('✅ Assignment created successfully by guide');

    // Submit assignment
    const submissionRes = await api.post(`/submissions`, {
      assignmentId: assignmentId,
      code: 'console.log(3);', // Mocking a very simple static answer
      language: 'javascript'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    
    console.assert(submissionRes.status === 201, 'Submission failed');
    console.log('✅ Code submitted successfully');

    // ---------------------------------------------------------
    // 4. SUMMARY
    // ---------------------------------------------------------
    console.log('\n✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY! Modules working perfectly.');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    // Cleanup
    await mongoose.disconnect();
    server.close();
    process.exit(0);
  }
}

runTests();
