export function fuzzyMatch(str, pattern) {
  // Simple fuzzy match: checking if pattern characters appear in str in order
  // Returns true if match, false otherwise.
  // Enhanced slightly to prioritize case-insensitive containment.
  
  if (!str) return false;
  
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();
  
  // 1. Exact substring match (highest priority in a real sort, but here just boolean)
  if (s.includes(p)) return true;
  
  // 2. Character sequence match
  let pIdx = 0;
  let sIdx = 0;
  
  while (pIdx < p.length && sIdx < s.length) {
    if (p[pIdx] === s[sIdx]) {
      pIdx++;
    }
    sIdx++;
  }
  
  return pIdx === p.length;
}

export function fuzzySearch(list, query, key = null) {
  if (!query) return list;
  
  return list.filter(item => {
    const target = key ? item[key] : item;
    return fuzzyMatch(String(target), query);
  });
}