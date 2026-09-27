const express = require('express');
const router = express.Router({ mergeParams: true });
const { getReviewsForSubmission, submitPeerReview } = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getReviewsForSubmission)
  .post(submitPeerReview);

module.exports = router;
