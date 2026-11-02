import { describe, expect, it } from 'vitest';
import { fuzzyMatch, highlightSegments } from './fuzzy';

const marked = (query: string, text: string) => {
  const match = fuzzyMatch(query, text);
  return match && highlightSegments(text, match.indices).map((s) => (s.match ? `[${s.text}]` : s.text)).join('');
};

describe('fuzzyMatch', () => {
  it('finds the best subsequence – word starts and runs win', () => {
    expect(marked('tewi', 'Set a due date with quick picks')).toBe('Set a due da[te] [wi]th quick picks');
  });

  it('prefers prefixes and contiguous matches', () => {
    expect(marked('share', 'Share this list with a friend')).toBe('[Share] this list with a friend');
    expect(marked('lf', 'Share this list with a friend')).toBe('Share this [l]ist with a [f]riend');
  });

  it('ignores case, spaces and diacritics', () => {
    expect(marked('ukol', 'Dokončit Úkol')).toBe('Dokončit [Úkol]');
    expect(marked('dat wi', 'due date with')).toBe('due [dat]e [wi]th');
  });

  it('returns null when characters are missing or out of order', () => {
    expect(fuzzyMatch('xyz', 'Buy milk')).toBeNull();
    expect(fuzzyMatch('klim', 'milk')).toBeNull();
  });

  it('ranks tighter matches higher', () => {
    const tight = fuzzyMatch('milk', 'Buy milk')!.score;
    const loose = fuzzyMatch('milk', 'Make it look kind')!.score;
    expect(tight).toBeGreaterThan(loose);
  });

  it('handles emoji (surrogate pairs) in highlights', () => {
    expect(marked('gig', '🎸 Metal gig')).toBe('🎸 Metal [gig]');
  });
});
