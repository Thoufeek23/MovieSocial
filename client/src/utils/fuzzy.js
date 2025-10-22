// Small fuzzy matching utilities: normalization, Levenshtein, and a BK-tree for fast approximate lookup

// Normalize a movie title for matching: uppercase and remove non-alphanumeric characters
export function normalizeTitle(s) {
  if (!s) return '';
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Compute Levenshtein distance (iterative DP, optimized by using only two rows)
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ai = a.charAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ai === b.charAt(j - 1) ? 0 : 1;
      const deletion = prev[j] + 1;
      const insertion = curr[j - 1] + 1;
      const substitution = prev[j - 1] + cost;
      curr[j] = Math.min(deletion, insertion, substitution);
    }
    // swap
    const tmp = prev; prev = curr; curr = tmp;
  }
  return prev[b.length];
}

// Simple BK-tree implementation for approximate string matching
class BKNode {
  constructor(term) {
    this.term = term;
    this.children = new Map(); // distance -> BKNode
  }
}

export function buildBKTree(terms = []) {
  const root = terms.length ? new BKNode(terms[0]) : null;
  for (let i = 1; i < terms.length; i++) {
    insertBK(root, terms[i]);
  }
  return root;
}

function insertBK(node, term) {
  if (!node) return new BKNode(term);
  const d = levenshtein(term, node.term);
  const child = node.children.get(d);
  if (child) insertBK(child, term);
  else node.children.set(d, new BKNode(term));
}

// Query the BK-tree for matches within maxDist. Returns array of {term, dist}
export function queryBK(root, term, maxDist) {
  const results = [];
  if (!root) return results;
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    const d = levenshtein(term, node.term);
    if (d <= maxDist) results.push({ term: node.term, dist: d });
    // children distances in range [d - maxDist, d + maxDist]
    const min = d - maxDist;
    const max = d + maxDist;
    for (const [k, child] of node.children.entries()) {
      if (k >= min && k <= max) stack.push(child);
    }
  }
  return results;
}

// Helper: pick the best match from BK results (smallest distance)
export function bestMatch(results) {
  if (!results || results.length === 0) return null;
  results.sort((a, b) => a.dist - b.dist);
  return results[0];
}
