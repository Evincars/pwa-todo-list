import { useSettingsStore } from '@/features/settings/settingsStore';

/** Short vibration on supported devices (Android); silently ignored elsewhere. */
export const haptic = (pattern: number | number[] = 12) => {
  if (!useSettingsStore.getState().haptics) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
};
