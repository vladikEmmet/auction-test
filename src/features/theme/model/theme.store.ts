import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  nextPreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/features/theme/model/theme';

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  cycle: () => void;
};

/**
 * Выбор темы переживает перезагрузку. Формат хранения совпадает с тем, что читает
 * скрипт в index.html: `{"state":{"preference":"dark"},"version":0}`.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
      cycle: () => set((state) => ({ preference: nextPreference(state.preference) })),
    }),
    { name: THEME_STORAGE_KEY },
  ),
);
