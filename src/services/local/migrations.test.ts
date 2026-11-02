import { describe, expect, it } from 'vitest';
import { migrateLocalData } from './migrations';

describe('migrateLocalData', () => {
  it('renames legacy emoji fields and leaves other documents alone', () => {
    localStorage.clear();
    localStorage.setItem('ns:lists/a', JSON.stringify({ id: 'a', emoji: '🛒' }));
    localStorage.setItem('ns:invitations/i', JSON.stringify({ id: 'i', listEmoji: '🛒' }));
    localStorage.setItem('ns:lists/a/todos/t', JSON.stringify({ id: 't', emoji: 'keep' }));

    migrateLocalData(localStorage, 'ns');
    migrateLocalData(localStorage, 'ns'); // idempotent

    expect(JSON.parse(localStorage.getItem('ns:lists/a')!)).toEqual({ id: 'a', icon: '🛒' });
    expect(JSON.parse(localStorage.getItem('ns:invitations/i')!)).toEqual({ id: 'i', listIcon: '🛒' });
    expect(JSON.parse(localStorage.getItem('ns:lists/a/todos/t')!)).toEqual({ id: 't', emoji: 'keep' });
  });
});
