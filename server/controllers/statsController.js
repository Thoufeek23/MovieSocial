const Review = require('../models/Review');
const User = require('../models/User');
const logger = require('../utils/logger');
const badges = require('../utils/badges');

// GET /api/stats/top-reviewers?period=month
// period currently unused; extend to support week/month/all-time
const topReviewers = async (req, res) => {
  try {
    // Simple aggregation: count reviews per user, sort desc, include username/avatar
    const agg = [
      { $group: { _id: '$user', reviewCount: { $sum: 1 } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, userId: '$_id', reviewCount: 1, username: '$user.username', avatar: '$user.avatar' } }
    ];
    const results = await Review.aggregate(agg);
    res.json(results);
  } catch (err) {
    logger.error('topReviewers error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/stats/top-reviewers/regions
// Returns an object mapping region -> top reviewers (array)
const topReviewersByRegions = async (req, res) => {
  try {
    // Aggregate reviews joined with users, group by user and region, then produce top reviewers per region

    // Build pipeline that counts reviews per user, retains user.region, sorts by region + reviewCount,
    // then groups by region pushing ordered users and slicing top 20.
    const agg = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $match: { 'userDoc.region': { $exists: true, $ne: '' } } },
      { $group: { _id: { user: '$user', region: '$userDoc.region' }, reviewCount: { $sum: 1 }, username: { $first: '$userDoc.username' }, avatar: { $first: '$userDoc.avatar' } } },
      // Sort so when we group by region the push will preserve desired order
      { $sort: { '_id.region': 1, reviewCount: -1 } },
      { $group: { _id: '$_id.region', users: { $push: { userId: '$_id.user', reviewCount: '$reviewCount', username: '$username', avatar: '$avatar' } } } },
      { $project: { _id: 0, region: '$_id', users: { $slice: ['$users', 20] } } }
    ];

    const results = await Review.aggregate(agg);

    // Convert to a mapping for easier consumption
    const map = {};
    results.forEach(r => { map[r.region] = r.users; });

    res.json(map);
  } catch (err) {
    logger.error('topReviewersByRegions error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/stats/top-reviewers/region/:region
const topReviewersByRegion = async (req, res) => {
  try {
    const region = req.params.region;
    // Join reviews -> users and filter by user.region
    const agg = [
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $match: { 'userDoc.region': region } },
      { $group: { _id: '$user', reviewCount: { $sum: 1 }, user: { $first: '$userDoc' } } },
      { $sort: { reviewCount: -1 } },
      { $limit: 50 },
      { $project: { _id: 0, userId: '$_id', reviewCount: 1, username: '$user.username', avatar: '$user.avatar', region: '$user.region' } }
    ];
    const results = await Review.aggregate(agg);
    res.json(results);
  } catch (err) {
    logger.error('topReviewersByRegion error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/stats/run-monthly-badges - admin/debug endpoint to compute badges for a given month
const runMonthlyBadges = async (req, res) => {
  try {
    const { year, month } = req.body; // month 1-12
    if (!year || !month) return res.status(400).json({ msg: 'year and month required' });
    // Run compute function (async)
    badges.computeMonthlyBadges(year, month).catch(err => logger.error('computeMonthlyBadges failed', err));
    res.json({ msg: 'Monthly badge compute started' });
  } catch (err) {
    logger.error('runMonthlyBadges error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { topReviewers, topReviewersByRegion, topReviewersByRegions, runMonthlyBadges };
