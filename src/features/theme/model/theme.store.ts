import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { THEME_STORAGE_KEY, type ThemePreference } from '@/features/theme/model/theme';

type ThemeState = {
  /** `system` — пока пользователь не выбрал тему явно. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
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
    }),
    { name: THEME_STORAGE_KEY },
  ),
);
