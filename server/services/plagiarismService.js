/**
 * Custom Plagiarism Detection Engine
 * 
 * Implements the Winnowing algorithm for document fingerprinting:
 * 1. Normalize — Strip comments, whitespace, lowercase
 * 2. Tokenize — Extract meaningful tokens
 * 3. K-Gram Generation — Sliding window of k tokens
 * 4. Hash — Rolling hash each k-gram
 * 5. Winnowing — Select minimum hash in each window of size w
 * 6. Compare — Jaccard similarity: |A ∩ B| / |A ∪ B| × 100
 * 7. Highlight — Map common fingerprints back to source regions
 */

const K_GRAM_SIZE = 5;   // Size of each k-gram
const WINDOW_SIZE = 4;   // Winnowing window size

// ======================= STEP 1: NORMALIZE =======================

/**
 * Normalize source code by removing comments, extra whitespace,
 * and converting to lowercase.
 */
function normalize(code, language) {
  let normalized = code;

  // Remove single-line comments
  if (['c', 'cpp', 'java', 'javascript'].includes(language)) {
    normalized = normalized.replace(/\/\/.*$/gm, '');
  }
  if (language === 'python') {
    normalized = normalized.replace(/#.*$/gm, '');
  }

  // Remove multi-line comments
  if (['c', 'cpp', 'java', 'javascript'].includes(language)) {
    normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  }
  if (language === 'python') {
    normalized = normalized.replace(/'''[\s\S]*?'''/g, '');
    normalized = normalized.replace(/"""[\s\S]*?"""/g, '');
  }

  // Remove string literals (replace with placeholder)
  normalized = normalized.replace(/"(?:[^"\\]|\\.)*"/g, '"STR"');
  normalized = normalized.replace(/'(?:[^'\\]|\\.)*'/g, "'STR'");

  // Remove extra whitespace, newlines → single space
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Lowercase
  normalized = normalized.toLowerCase();

  return normalized;
}

// ======================= STEP 2: TOKENIZE =======================

/**
 * Tokenize normalized code into meaningful tokens.
 * Extracts identifiers, keywords, operators, and delimiters.
 */
function tokenize(normalizedCode) {
  // Simple tokenizer: split on non-alphanumeric, keep tokens
  const tokens = normalizedCode
    .split(/([a-z_][a-z0-9_]*|[0-9]+|[{}()\[\];,=+\-*/<>!&|^~%.])/g)
    .filter((t) => t && t.trim().length > 0)
    .map((t) => t.trim());

  return tokens;
}

// ======================= STEP 3: K-GRAMS =======================

/**
 * Generate k-grams from token array.
 * Each k-gram is a string of k consecutive tokens joined.
 */
function generateKGrams(tokens, k = K_GRAM_SIZE) {
  const kgrams = [];
  for (let i = 0; i <= tokens.length - k; i++) {
    kgrams.push({
      value: tokens.slice(i, i + k).join(' '),
      position: i,
    });
  }
  return kgrams;
}

// ======================= STEP 4: HASH =======================

/**
 * Hash a string using a simple but effective polynomial rolling hash.
 * Returns a 32-bit integer hash value.
 */
function hashString(str) {
  const BASE = 31;
  const MOD = 1e9 + 7;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * BASE + str.charCodeAt(i)) % MOD;
  }
  return Math.abs(hash);
}

/**
 * Hash all k-grams, returning array of { hash, position }
 */
function hashKGrams(kgrams) {
  return kgrams.map((kg) => ({
    hash: hashString(kg.value),
    position: kg.position,
  }));
}

// ======================= STEP 5: WINNOWING =======================

/**
 * Select fingerprints using the Winnowing algorithm.
 * In each window of size w, select the minimum hash.
 * If there are ties, select the rightmost occurrence.
 * Returns Set of selected hash values with positions.
 */
function winnow(hashedKGrams, w = WINDOW_SIZE) {
  if (hashedKGrams.length === 0) return [];

  const fingerprints = [];
  let prevMinIndex = -1;

  for (let i = 0; i <= hashedKGrams.length - w; i++) {
    const window = hashedKGrams.slice(i, i + w);

    // Find minimum hash in window (rightmost in case of tie)
    let minIdx = 0;
    for (let j = 1; j < window.length; j++) {
      if (window[j].hash <= window[minIdx].hash) {
        minIdx = j;
      }
    }

    const globalIdx = i + minIdx;

    // Only add if this is a new fingerprint (not the same as previous)
    if (globalIdx !== prevMinIndex) {
      fingerprints.push({
        hash: hashedKGrams[globalIdx].hash,
        position: hashedKGrams[globalIdx].position,
      });
      prevMinIndex = globalIdx;
    }
  }

  return fingerprints;
}

// ======================= STEP 6: COMPARE =======================

/**
 * Calculate Jaccard similarity between two sets of fingerprints.
 * Returns percentage (0-100).
 */
function jaccardSimilarity(fingerprints1, fingerprints2) {
  const set1 = new Set(fingerprints1.map((f) => f.hash));
  const set2 = new Set(fingerprints2.map((f) => f.hash));

  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;

  return (intersection.size / union.size) * 100;
}

// ======================= STEP 7: HIGHLIGHT =======================

/**
 * Find matching regions between two submissions based on common fingerprints.
 * Returns array of { file1: { start, end, content }, file2: { start, end, content } }
 */
function findMatchingRegions(code1, code2, tokens1, tokens2, fingerprints1, fingerprints2) {
  const set1Hashes = new Map();
  fingerprints1.forEach((f) => {
    if (!set1Hashes.has(f.hash)) set1Hashes.set(f.hash, []);
    set1Hashes.get(f.hash).push(f.position);
  });

  const commonRegions = [];

  for (const fp2 of fingerprints2) {
    if (set1Hashes.has(fp2.hash)) {
      const positions1 = set1Hashes.get(fp2.hash);

      for (const pos1 of positions1) {
        const startPos1 = pos1;
        const endPos1 = Math.min(pos1 + K_GRAM_SIZE, tokens1.length);
        const startPos2 = fp2.position;
        const endPos2 = Math.min(fp2.position + K_GRAM_SIZE, tokens2.length);

        commonRegions.push({
          file1: {
            start: startPos1,
            end: endPos1,
            content: tokens1.slice(startPos1, endPos1).join(' '),
          },
          file2: {
            start: startPos2,
            end: endPos2,
            content: tokens2.slice(startPos2, endPos2).join(' '),
          },
        });
      }
    }
  }

  // Merge overlapping regions and limit to top matches
  return mergeRegions(commonRegions).slice(0, 20);
}

/**
 * Merge overlapping matching regions to reduce noise.
 */
function mergeRegions(regions) {
  if (regions.length === 0) return [];

  // Sort by file1 start position
  regions.sort((a, b) => a.file1.start - b.file1.start);

  const merged = [regions[0]];

  for (let i = 1; i < regions.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = regions[i];

    if (curr.file1.start <= prev.file1.end + 2) {
      // Merge: extend the end
      prev.file1.end = Math.max(prev.file1.end, curr.file1.end);
      prev.file1.content = prev.file1.content + ' ' + curr.file1.content;
      prev.file2.end = Math.max(prev.file2.end, curr.file2.end);
      prev.file2.content = prev.file2.content + ' ' + curr.file2.content;
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

// ======================= MAIN API =======================

/**
 * Compare two code submissions and return similarity report.
 * 
 * @param {string} code1 - First submission code
 * @param {string} code2 - Second submission code
 * @param {string} language - Programming language
 * @returns {{ similarityScore, matchingRegions, fingerprints1Count, fingerprints2Count, commonFingerprintsCount }}
 */
function compareSubmissions(code1, code2, language = 'python') {
  // Step 1: Normalize
  const norm1 = normalize(code1, language);
  const norm2 = normalize(code2, language);

  // Step 2: Tokenize
  const tokens1 = tokenize(norm1);
  const tokens2 = tokenize(norm2);

  // Handle very short code
  if (tokens1.length < K_GRAM_SIZE || tokens2.length < K_GRAM_SIZE) {
    return {
      similarityScore: 0,
      matchingRegions: [],
      fingerprints1Count: 0,
      fingerprints2Count: 0,
      commonFingerprintsCount: 0,
    };
  }

  // Step 3: Generate k-grams
  const kgrams1 = generateKGrams(tokens1);
  const kgrams2 = generateKGrams(tokens2);

  // Step 4: Hash k-grams
  const hashed1 = hashKGrams(kgrams1);
  const hashed2 = hashKGrams(kgrams2);

  // Step 5: Winnowing
  const fingerprints1 = winnow(hashed1);
  const fingerprints2 = winnow(hashed2);

  // Step 6: Calculate Jaccard similarity
  const similarityScore = jaccardSimilarity(fingerprints1, fingerprints2);

  // Step 7: Find matching regions
  const matchingRegions = findMatchingRegions(
    code1, code2, tokens1, tokens2, fingerprints1, fingerprints2
  );

  // Count common fingerprints
  const set1 = new Set(fingerprints1.map((f) => f.hash));
  const set2 = new Set(fingerprints2.map((f) => f.hash));
  const commonCount = [...set1].filter((h) => set2.has(h)).length;

  return {
    similarityScore: Math.round(similarityScore * 100) / 100,
    matchingRegions,
    fingerprints1Count: fingerprints1.length,
    fingerprints2Count: fingerprints2.length,
    commonFingerprintsCount: commonCount,
  };
}

/**
 * Compare all submissions for an assignment pairwise.
 * Returns array of comparison results for each pair.
 */
function compareAllSubmissions(submissions, language) {
  const results = [];

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const code1 = submissions[i].code;
      const code2 = submissions[j].code;

      const comparison = compareSubmissions(code1, code2, language);

      results.push({
        submission1Id: submissions[i].id,
        submission2Id: submissions[j].id,
        student1Id: submissions[i].studentId,
        student2Id: submissions[j].studentId,
        ...comparison,
      });
    }
  }

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results;
}

module.exports = {
  normalize,
  tokenize,
  generateKGrams,
  hashString,
  hashKGrams,
  winnow,
  jaccardSimilarity,
  findMatchingRegions,
  compareSubmissions,
  compareAllSubmissions,
};
