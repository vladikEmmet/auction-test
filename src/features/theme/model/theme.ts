export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export type ResolvedTheme = 'light' | 'dark';

/** Ключ хранилища вынесен сюда: его же читает антимигальный скрипт в index.html. */
export const THEME_STORAGE_KEY = 'auctions:theme';

/** Итоговая тема: «системная» разворачивается в текущее предпочтение ОС. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

/** Класс на <html> — единственный переключатель палитры; токены живут в index.css. */
export function applyThemeClass(theme: ResolvedTheme, root: HTMLElement): void {
  root.classList.toggle('dark', theme === 'dark');
}
