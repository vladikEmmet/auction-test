import { useEffect, useState } from 'react';

import {
  applyThemeClass,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/features/theme/model/theme';
import { useThemeStore } from '@/features/theme/model/theme.store';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

export function useTheme(): {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
} {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const theme = resolveTheme(preference, systemPrefersDark);

  useEffect(() => {
    applyThemeClass(theme, document.documentElement);
  }, [theme]);

  return { preference, theme, setPreference };
}
