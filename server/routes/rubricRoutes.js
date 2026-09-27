const express = require('express');
const router = express.Router({ mergeParams: true });
const { getRubricByAssignment, upsertRubric } = require('../controllers/rubricController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getRubricByAssignment)
  .post(upsertRubric);

module.exports = router;
