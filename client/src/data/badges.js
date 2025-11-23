const BADGE_MAP = {
  new_user: { id: 'new_user', title: 'New user', short: 'New User', description: 'Welcome to MovieSocial! This badge marks your first step into our movie community.', color: 'bg-green-600', icon: '🎬' },
  first_review: { id: 'first_review', title: 'First Reviewer', short: 'First Review', description: 'Awarded when a user posts their first review.', color: 'bg-yellow-500', icon: '⭐' },
  diamond_i: { id: 'diamond_i', title: 'Diamond I', short: 'Diamond I', description: 'Top reviewer: outstanding community agreement and high contribution.', color: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500', icon: '💎' },
  gold_i: { id: 'gold_i', title: 'Gold I', short: 'Gold I', description: 'Top reviewer: excellent community agreement.', color: 'bg-yellow-400', icon: '🥇' },
  silver_i: { id: 'silver_i', title: 'Silver I', short: 'Silver I', description: 'Top reviewer: strong community agreement.', color: 'bg-gray-400', icon: '🥈' },
  bronze_i: { id: 'bronze_i', title: 'Bronze I', short: 'Bronze I', description: 'Top reviewer: good participation.', color: 'bg-amber-700', icon: '🥉' },
  // II/III/IV variants reuse same descriptions with level info
  diamond_ii: { id: 'diamond_ii', title: 'Diamond II', short: 'Diamond II', description: 'Monthly top reviewer — level II', color: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500', icon: '💎' },
  gold_ii: { id: 'gold_ii', title: 'Gold II', short: 'Gold II', description: 'Monthly top reviewer — level II', color: 'bg-yellow-400', icon: '🥇' },
  silver_ii: { id: 'silver_ii', title: 'Silver II', short: 'Silver II', description: 'Monthly top reviewer — level II', color: 'bg-gray-400', icon: '🥈' },
  bronze_ii: { id: 'bronze_ii', title: 'Bronze II', short: 'Bronze II', description: 'Monthly top reviewer — level II', color: 'bg-amber-700', icon: '🥉' },
  diamond_iii: { id: 'diamond_iii', title: 'Diamond III', short: 'Diamond III', description: 'Monthly top reviewer — level III', color: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500', icon: '💎' },
  gold_iii: { id: 'gold_iii', title: 'Gold III', short: 'Gold III', description: 'Monthly top reviewer — level III', color: 'bg-yellow-400', icon: '🥇' },
  silver_iii: { id: 'silver_iii', title: 'Silver III', short: 'Silver III', description: 'Monthly top reviewer — level III', color: 'bg-gray-400', icon: '🥈' },
  bronze_iii: { id: 'bronze_iii', title: 'Bronze III', short: 'Bronze III', description: 'Monthly top reviewer — level III', color: 'bg-amber-700', icon: '🥉' },
  diamond_iv: { id: 'diamond_iv', title: 'Diamond IV', short: 'Diamond IV', description: 'Monthly top reviewer — level IV', color: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500', icon: '💎' },
  gold_iv: { id: 'gold_iv', title: 'Gold IV', short: 'Gold IV', description: 'Monthly top reviewer — level IV', color: 'bg-yellow-400', icon: '🥇' },
  silver_iv: { id: 'silver_iv', title: 'Silver IV', short: 'Silver IV', description: 'Monthly top reviewer — level IV', color: 'bg-gray-400', icon: '🥈' },
  bronze_iv: { id: 'bronze_iv', title: 'Bronze IV', short: 'Bronze IV', description: 'Monthly top reviewer — level IV', color: 'bg-amber-700', icon: '🥉' },
};

export default BADGE_MAP;
