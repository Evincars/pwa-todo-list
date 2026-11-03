import { describe, expect, it } from 'vitest';
import { enabledProviders } from './providers';

describe('enabledProviders', () => {
  it('keeps the configured order of known providers', () => {
    expect(enabledProviders('google, facebook')).toEqual(['google', 'facebook']);
    expect(enabledProviders('apple,google')).toEqual(['google', 'apple']);
  });

  it('hides Apple unless configured and ignores unknown values', () => {
    expect(enabledProviders(undefined)).toEqual(['google', 'facebook']);
    expect(enabledProviders('twitter')).toEqual(['google', 'facebook']);
  });
});
