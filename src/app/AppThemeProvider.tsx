import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { useColorScheme } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { useEffect, useMemo, type PropsWithChildren } from 'react';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { createAppTheme, createCssVariablesResolver } from '@/theme/createAppTheme';
import { THEME_PRESETS } from '@/theme/presets';

/** Derives the Mantine theme from user settings (Zustand) and applies document-level tweaks. */
export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const themeId = useSettingsStore((state) => state.themeId);
  const radius = useSettingsStore((state) => state.radius);
  const preference = useSettingsStore((state) => state.colorScheme);
  const fontScale = useSettingsStore((state) => state.fontScale);
  const weekStartsOn = useSettingsStore((state) => state.weekStartsOn);
  const systemScheme = useColorScheme('light', { getInitialValueInEffect: false });

  const colorScheme = preference === 'system' ? systemScheme : preference;
  const theme = useMemo(() => createAppTheme({ themeId, radius }), [themeId, radius]);
  const cssVariablesResolver = useMemo(() => createCssVariablesResolver(themeId), [themeId]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
  }, [fontScale]);

  // Tint the mobile browser / PWA status bar to match the active background.
  useEffect(() => {
    const { preview } = THEME_PRESETS[themeId];
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colorScheme === 'dark' ? preview.dark : preview.light);
  }, [themeId, colorScheme]);

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme} cssVariablesResolver={cssVariablesResolver}>
      <DatesProvider settings={{ firstDayOfWeek: weekStartsOn, consistentWeeks: true }}>
        <Notifications position="top-center" limit={3} zIndex={1000} />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
};
