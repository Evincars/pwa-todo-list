import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { cs } from './locales/cs';
import { en } from './locales/en';

export const SUPPORTED_LANGUAGES = ['en', 'cs'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = Language | 'system';

/** Native names – shown untranslated so people can find their language. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', cs: 'Čeština' };

const FALLBACK: Language = 'en';

const isLanguage = (value: string): value is Language => (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

/** First supported language of the OS / browser (iOS and Android expose the system language here). */
export const detectSystemLanguage = (): Language => {
  const candidates = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  for (const tag of candidates) {
    const base = tag.toLowerCase().split('-')[0] ?? '';
    if (isLanguage(base)) return base;
  }
  return FALLBACK;
};

export const resolveLanguage = (preference: LanguagePreference): Language =>
  preference === 'system' ? detectSystemLanguage() : preference;

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, cs: { translation: cs } },
  lng: FALLBACK,
  fallbackLng: FALLBACK,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

/** Switches UI strings, date formatting (dayjs, Mantine dates) and `<html lang>`. */
export const applyLanguage = (preference: LanguagePreference) => {
  const language = resolveLanguage(preference);
  dayjs.locale(language);
  document.documentElement.lang = language;
  if (i18n.language !== language) void i18n.changeLanguage(language);
  return language;
};

export const t = i18n.t.bind(i18n);
