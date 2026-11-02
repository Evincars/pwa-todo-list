import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Priority } from '@/domain/types';
import type { TodoFilter, TodoSortKey } from '@/domain/todoQuery';
import type { RadiusOption } from '@/theme/createAppTheme';
import type { ThemeId } from '@/theme/presets';

export type ColorSchemePreference = 'light' | 'dark' | 'system';
export type TimeFormat = '12h' | '24h';
export type WeekStart = 0 | 1;

export interface ListViewPrefs {
  sort: TodoSortKey;
  filter: TodoFilter;
  showCompleted: boolean;
}

export interface Settings {
  colorScheme: ColorSchemePreference;
  themeId: ThemeId;
  radius: RadiusOption;
  /** Root font-size multiplier, scales the whole UI. */
  fontScale: number;
  timeFormat: TimeFormat;
  weekStartsOn: WeekStart;
  defaultSort: TodoSortKey;
  defaultPriority: Priority;
  showCompleted: boolean;
  confirmDelete: boolean;
  haptics: boolean;
}

interface SettingsState extends Settings {
  /** Per-list view preferences (device local, not synced). */
  listPrefs: Record<string, Partial<ListViewPrefs>>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setListPrefs: (listId: string, prefs: Partial<ListViewPrefs>) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS: Settings = {
  colorScheme: 'system',
  themeId: 'classic',
  radius: 'md',
  fontScale: 1,
  timeFormat: '24h',
  weekStartsOn: 1,
  defaultSort: 'smart',
  defaultPriority: 'none',
  showCompleted: true,
  confirmDelete: true,
  haptics: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      listPrefs: {},
      setSetting: (key, value) => set({ [key]: value }),
      setListPrefs: (listId, prefs) =>
        set((state) => ({ listPrefs: { ...state.listPrefs, [listId]: { ...state.listPrefs[listId], ...prefs } } })),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: 'shared-todo/settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ setSetting: _s, setListPrefs: _l, resetSettings: _r, ...state }) => state,
    },
  ),
);

export const useListViewPrefs = (listId: string): ListViewPrefs => {
  const prefs = useSettingsStore((state) => state.listPrefs[listId]);
  const defaultSort = useSettingsStore((state) => state.defaultSort);
  const showCompleted = useSettingsStore((state) => state.showCompleted);
  return {
    sort: prefs?.sort ?? defaultSort,
    filter: prefs?.filter ?? 'all',
    showCompleted: prefs?.showCompleted ?? showCompleted,
  };
};
