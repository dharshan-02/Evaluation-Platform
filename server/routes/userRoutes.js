const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser, generateStudentReport } = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

router.use(auth);

router.get('/', authorize('admin', 'faculty', 'student'), getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', authorize('admin'), getUser);
router.get('/:id/report', authorize('admin', 'faculty', 'student'), generateStudentReport);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
