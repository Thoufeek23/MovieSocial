const logger = require('./logger');
const User = require('../models/User');

// Badge definitions — add new badges here. id should be stable.
const BADGES = {
  NEW_USER: { id: 'new_user', name: 'Welcome to MovieSocial!' },
  FIRST_REVIEW: { id: 'first_review', name: 'First Reviewer' },
  REVIEW_STREAK_3: { id: 'streak_3', name: '3-day Streak' },
  REVIEW_STREAK_7: { id: 'streak_7', name: '7-day Streak' },
  TOP_REVIEWER_MONTH: { id: 'top_reviewer_month', name: 'Top Reviewer (Month)' },
  COMMUNITY_FAVOURITE: { id: 'community_favourite', name: 'Community Favourite' },
  // Tiered monthly badges
  DIAMOND_I: { id: 'diamond_i', name: 'Diamond I' },
  GOLD_I: { id: 'gold_i', name: 'Gold I' },
  SILVER_I: { id: 'silver_i', name: 'Silver I' },
  BRONZE_I: { id: 'bronze_i', name: 'Bronze I' },
  DIAMOND_II: { id: 'diamond_ii', name: 'Diamond II' },
  GOLD_II: { id: 'gold_ii', name: 'Gold II' },
  SILVER_II: { id: 'silver_ii', name: 'Silver II' },
  BRONZE_II: { id: 'bronze_ii', name: 'Bronze II' },
  DIAMOND_III: { id: 'diamond_iii', name: 'Diamond III' },
  GOLD_III: { id: 'gold_iii', name: 'Gold III' },
  SILVER_III: { id: 'silver_iii', name: 'Silver III' },
  BRONZE_III: { id: 'bronze_iii', name: 'Bronze III' },
  DIAMOND_IV: { id: 'diamond_iv', name: 'Diamond IV' },
  GOLD_IV: { id: 'gold_iv', name: 'Gold IV' },
  SILVER_IV: { id: 'silver_iv', name: 'Silver IV' },
  BRONZE_IV: { id: 'bronze_iv', name: 'Bronze IV' },
};

// Helper: check if user has badge
async function hasBadge(userId, badgeId) {
  const user = await User.findById(userId).select('badges');
  if (!user) return false;
  return (user.badges || []).some(b => String(b.id) === String(badgeId));
}

// Award a badge if not already awarded
async function awardBadge(userId, badge) {
  try {
    const already = await hasBadge(userId, badge.id);
    if (already) return false;
    await User.findByIdAndUpdate(userId, { $push: { badges: { id: badge.id, name: badge.name, awardedAt: new Date() } } });
    logger.info(`Awarded badge ${badge.id} to user ${userId}`);
    return true;
  } catch (err) {
    logger.error('awardBadge error', err);
    return false;
  }
}

// Remove any previous monthly-tier badges (diamond/gold/silver/bronze variants)
async function removeMonthlyTierBadges(userId) {
  try {
    // build list of monthly badge ids from BADGES where id starts with diamond_|gold_|silver_|bronze_
    const monthlyIds = Object.values(BADGES)
      .map(b => String(b.id || '').toLowerCase())
      .filter(id => /^(diamond|gold|silver|bronze)_/.test(id));

    if (monthlyIds.length === 0) return;
    await User.findByIdAndUpdate(userId, { $pull: { badges: { id: { $in: monthlyIds } } } });
    logger.info(`Removed previous monthly tier badges for user ${userId}`);
  } catch (err) {
    logger.error('removeMonthlyTierBadges error', err);
  }
}

// Award new user badge (called during signup)
async function handleNewUser(userId) {
  try {
    await awardBadge(userId, BADGES.NEW_USER);
  } catch (err) {
    logger.error('handleNewUser error', err);
  }
}

// Badge checks (examples)
// Called after a user posts a review
async function handlePostReview(userId) {
  try {
    // Award first review badge if applicable
    const UserModel = require('../models/User');
    const Review = require('../models/Review');
    const count = await Review.countDocuments({ user: userId });
    if (count === 1) {
      await awardBadge(userId, BADGES.FIRST_REVIEW);
    }
    // Streak checks could be implemented here (left simple):
    // For demo, we won't implement full streak detection yet.
  } catch (err) {
    logger.error('handlePostReview error', err);
  }
}

// Simple public API
module.exports = {
  BADGES,
  hasBadge,
  awardBadge,
  handleNewUser,
  handlePostReview,
};

// Compute monthly badges for a specific year/month (month: 1-12).
// This is intended to be run as a scheduled job (e.g., cron) at month end.
module.exports.computeMonthlyBadges = async function computeMonthlyBadges(year, month) {
  try {
    const Review = require('../models/Review');
    const User = require('../models/User');

    // Compute start and end of month
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    // Aggregate per-user review counts and agreement averages
    const agg = [
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $project: { user: 1, agreementVotes: 1 } },
      { $group: {
        _id: '$user',
        reviewCount: { $sum: 1 },
        votes: { $push: '$agreementVotes' }
      }},
    ];

    const perUser = await Review.aggregate(agg);

    for (const u of perUser) {
      try {
        const userId = u._id;
        const reviewCount = u.reviewCount || 0;

        // Flatten votes array and compute agreement average (0-1 scale)
        const votesArr = (u.votes || []).flat().filter(v => v && typeof v.value !== 'undefined');
        let agreementFraction = 1; // default
        if (votesArr.length > 0) {
          const sum = votesArr.reduce((s, v) => s + Number(v.value || 0), 0);
          agreementFraction = sum / votesArr.length; // 0..1
        }
        const agreementPercent = Math.round(agreementFraction * 100);

        // Determine tier and level
        let level = 'IV';
        if (reviewCount > 15) level = 'I';
        else if (reviewCount > 12) level = 'II';
        else if (reviewCount > 10) level = 'III';
        else level = 'IV';

        // Determine medal by agreementPercent
        let medal = 'BRONZE';
        if (agreementPercent > 85) medal = 'DIAMOND';
        else if (agreementPercent > 75) medal = 'GOLD';
        else if (agreementPercent > 65) medal = 'SILVER';
        else medal = 'BRONZE';

        // Build badge id
        const badgeKey = `${medal}_${level}`.toUpperCase();
        const badge = BADGES[badgeKey];
        if (!badge) {
          logger.warn('Unknown badge key', badgeKey);
          continue;
        }

  // Remove previous monthly-tier badges for this user, then award the new one
  await removeMonthlyTierBadges(userId);
  await awardBadge(userId, badge);

      } catch (e) {
        logger.error('Failed to compute badge for user', u._id, e);
      }
    }

    logger.info('Monthly badge compute finished for', year, month);
  } catch (err) {
    logger.error('computeMonthlyBadges error', err);
  }
};
