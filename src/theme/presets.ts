import type { MantineColorsTuple, MantineThemeColors } from '@mantine/core';

export const THEME_IDS = ['classic', 'lavender', 'ocean', 'forest', 'sunset', 'rose', 'nord', 'paper', 'midnight', 'amoled'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** Names and descriptions are translated (`themes.<id>`). */
export interface ThemePreset {
  id: ThemeId;
  primaryColor: string;
  primaryShade?: { light: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; dark: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 };
  /** Extra palettes registered in the theme (custom primary colors, `dark` override). */
  colors?: Partial<MantineThemeColors>;
  /** Overrides the light body background. */
  lightBody?: string;
  /** Hex values used for the preview tile and the PWA status bar. */
  preview: { accent: string; light: string; dark: string };
}

const nordFrost: MantineColorsTuple = ['#eaf1f8', '#d5e3ef', '#b3cbe1', '#8fb2d3', '#7aa1c7', '#5e81ac', '#56769d', '#4a678a', '#3f5876', '#334962'];
const nordNight: MantineColorsTuple = ['#eceff4', '#d8dee9', '#a3abb9', '#7b8496', '#4c566a', '#434c5e', '#3b4252', '#2e3440', '#272c36', '#21252e'];
const sepia: MantineColorsTuple = ['#fbf3e8', '#f3e2c9', '#e8cba1', '#ddb377', '#d49f55', '#cf923f', '#b87d30', '#a06b26', '#875a1e', '#6e4914'];
const sepiaDark: MantineColorsTuple = ['#e0d8cc', '#c9bfb0', '#9b9182', '#7a7062', '#4d463d', '#3f3932', '#332e28', '#28241f', '#211d19', '#171411'];
const midnight: MantineColorsTuple = ['#c9d1e3', '#aab4cc', '#7d89a8', '#5b6788', '#3a4566', '#2c3655', '#222b47', '#1a2139', '#141a2e', '#0d1120'];
const amoled: MantineColorsTuple = ['#dedede', '#b8b8b8', '#828282', '#5c5c5c', '#333333', '#262626', '#161616', '#000000', '#000000', '#000000'];

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  classic: {
    id: 'classic',
    primaryColor: 'blue',
    preview: { accent: '#228be6', light: '#ffffff', dark: '#242424' },
  },
  lavender: {
    id: 'lavender',
    primaryColor: 'violet',
    preview: { accent: '#7950f2', light: '#ffffff', dark: '#242424' },
  },
  ocean: {
    id: 'ocean',
    primaryColor: 'cyan',
    preview: { accent: '#15aabf', light: '#ffffff', dark: '#242424' },
  },
  forest: {
    id: 'forest',
    primaryColor: 'teal',
    preview: { accent: '#12b886', light: '#ffffff', dark: '#242424' },
  },
  sunset: {
    id: 'sunset',
    primaryColor: 'orange',
    preview: { accent: '#fd7e14', light: '#ffffff', dark: '#242424' },
  },
  rose: {
    id: 'rose',
    primaryColor: 'pink',
    preview: { accent: '#e64980', light: '#ffffff', dark: '#242424' },
  },
  nord: {
    id: 'nord',
    primaryColor: 'nord',
    primaryShade: { light: 5, dark: 4 },
    colors: { nord: nordFrost, dark: nordNight },
    lightBody: '#f4f6f9',
    preview: { accent: '#5e81ac', light: '#eceff4', dark: '#2e3440' },
  },
  paper: {
    id: 'paper',
    primaryColor: 'sepia',
    primaryShade: { light: 7, dark: 5 },
    colors: { sepia, dark: sepiaDark },
    lightBody: '#faf6ef',
    preview: { accent: '#a06b26', light: '#faf6ef', dark: '#28241f' },
  },
  midnight: {
    id: 'midnight',
    primaryColor: 'indigo',
    colors: { dark: midnight },
    preview: { accent: '#4c6ef5', light: '#ffffff', dark: '#1a2139' },
  },
  amoled: {
    id: 'amoled',
    primaryColor: 'grape',
    colors: { dark: amoled },
    preview: { accent: '#be4bdb', light: '#ffffff', dark: '#000000' },
  },
};
