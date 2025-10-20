const express = require('express');
const router = express.Router();
const { topReviewers, topReviewersByRegion, runMonthlyBadges, topReviewersByRegions } = require('../controllers/statsController');

router.get('/top-reviewers', topReviewers);
router.get('/top-reviewers/region/:region', topReviewersByRegion);
router.get('/top-reviewers/regions', topReviewersByRegions);

// Admin/debug endpoint - should be protected in production
router.post('/run-monthly-badges', runMonthlyBadges);
// Dev-only: grant badge to a user by username
// dev grant-badge route removed

module.exports = router;
