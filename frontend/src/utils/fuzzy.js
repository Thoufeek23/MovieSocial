// Fuzzy matching utilities for Modle game

/**
 * Normalize a movie title for comparison
 * @param {string} title - The title to normalize
 * @returns {string} - Normalized title
 */
export const normalizeTitle = (title) => {
  if (!title) return '';
  
  return title
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
export const levenshtein = (str1, str2) => {
  if (!str1) return str2 ? str2.length : 0;
  if (!str2) return str1.length;
  
  const matrix = [];
  
  // Create matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Get local date in YYYY-MM-DD format
 * @param {Date} date - Date object (defaults to today)
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const localYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};