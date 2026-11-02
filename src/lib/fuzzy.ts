/**
 * Subsequence ("fzf-like") matching: every query character has to appear in the text in order,
 * e.g. `tewi` matches "da**te** **wi**th quick". Of all possible alignments the best one is chosen –
 * matches at word starts and consecutive runs score higher, gaps cost a little.
 * Case and diacritics are ignored ("ukol" finds "Úkol").
 */

export interface FuzzyMatch {
  score: number;
  /** Indices of the matched characters in the original text (ascending). */
  indices: number[];
}

const MATCH = 16;
const WORD_START_BONUS = 10;
const CONSECUTIVE_BONUS = 12;
const GAP_PENALTY = 1;
/** Penalty per character before the first match – earlier matches rank higher. */
const LEADING_PENALTY = 0.5;

const fold = (char: string) => char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const isWordChar = (char: string | undefined) => !!char && /[\p{L}\p{N}]/u.test(char);

export const fuzzyMatch = (query: string, text: string): FuzzyMatch | null => {
  const needle = [...fold(query).replace(/\s+/g, '')];
  if (!needle.length) return { score: 0, indices: [] };
  const chars = [...text];
  const folded = chars.map(fold);
  const n = chars.length;
  const m = needle.length;
  if (m > n) return null;

  const NONE = Number.NEGATIVE_INFINITY;
  // score[j][i]: best score with needle[j] matched at text position i; from[j][i]: position of needle[j-1].
  const score = Array.from({ length: m }, () => new Float64Array(n).fill(NONE));
  const from = Array.from({ length: m }, () => new Int32Array(n).fill(-1));

  for (let j = 0; j < m; j++) {
    // Running best of `score[j-1][k] + GAP_PENALTY * k` over k < i - 1 (linear gap cost in O(1)).
    let bestGapped = NONE;
    let bestGappedAt = -1;
    for (let i = j; i < n; i++) {
      if (j > 0 && i >= 2) {
        const candidate = score[j - 1]![i - 2]! + GAP_PENALTY * (i - 2);
        if (candidate > bestGapped) {
          bestGapped = candidate;
          bestGappedAt = i - 2;
        }
      }
      if (folded[i] !== needle[j]) continue;

      const charScore = MATCH + (isWordChar(chars[i - 1]) ? 0 : WORD_START_BONUS);
      if (j === 0) {
        score[0]![i] = charScore - LEADING_PENALTY * i;
        continue;
      }
      const consecutive = score[j - 1]![i - 1] ?? NONE;
      const viaConsecutive = consecutive + CONSECUTIVE_BONUS;
      const viaGap = bestGapped - GAP_PENALTY * (i - 1);
      if (viaConsecutive === NONE && viaGap === NONE) continue;
      if (viaConsecutive >= viaGap) {
        score[j]![i] = charScore + viaConsecutive;
        from[j]![i] = i - 1;
      } else {
        score[j]![i] = charScore + viaGap;
        from[j]![i] = bestGappedAt;
      }
    }
  }

  let best = NONE;
  let end = -1;
  for (let i = 0; i < n; i++) {
    if (score[m - 1]![i]! > best) {
      best = score[m - 1]![i]!;
      end = i;
    }
  }
  if (end < 0) return null;

  const codePointIndices: number[] = [];
  for (let j = m - 1, i = end; j >= 0; j--) {
    codePointIndices.push(i);
    i = from[j]![i]!;
  }
  // Map code point positions back to UTF-16 string indices (emoji are two code units).
  const offsets: number[] = [];
  let offset = 0;
  for (const char of chars) {
    offsets.push(offset);
    offset += char.length;
  }
  return { score: best, indices: codePointIndices.reverse().map((index) => offsets[index]!) };
};

/** Splits `text` into plain / matched segments for rendering. */
export const highlightSegments = (text: string, indices: readonly number[]): { text: string; match: boolean }[] => {
  const marked = new Set(indices);
  const segments: { text: string; match: boolean }[] = [];
  for (let index = 0; index < text.length; ) {
    const codePoint = text.codePointAt(index)!;
    const char = String.fromCodePoint(codePoint);
    const match = marked.has(index);
    const last = segments[segments.length - 1];
    if (last && last.match === match) last.text += char;
    else segments.push({ text: char, match });
    index += char.length;
  }
  return segments;
};
