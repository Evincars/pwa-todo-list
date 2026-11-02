import { createTheme, type CSSVariablesResolver, type MantineThemeOverride } from '@mantine/core';
import { THEME_PRESETS, type ThemeId } from './presets';

export const RADIUS_OPTIONS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export interface AppThemeOptions {
  themeId: ThemeId;
  radius: RadiusOption;
}

export const createAppTheme = ({ themeId, radius }: AppThemeOptions): MantineThemeOverride => {
  const preset = THEME_PRESETS[themeId];
  return createTheme({
    primaryColor: preset.primaryColor,
    primaryShade: preset.primaryShade ?? { light: 6, dark: 7 },
    // Spread conditionally: an explicit `colors: undefined` would wipe Mantine's default palette.
    ...(preset.colors && { colors: preset.colors }),
    defaultRadius: radius,
    cursorType: 'pointer',
    autoContrast: true,
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headings: { fontWeight: '700' },
    components: {
      ActionIcon: { defaultProps: { variant: 'subtle' } },
      Drawer: { defaultProps: { transitionProps: { duration: 220 } } },
    },
  });
};

export const createCssVariablesResolver =
  (themeId: ThemeId): CSSVariablesResolver =>
  () => {
    const { lightBody } = THEME_PRESETS[themeId];
    const light: Record<string, string> = {};
    if (lightBody) light['--mantine-color-body'] = lightBody;
    return { variables: {}, light, dark: {} };
  };
