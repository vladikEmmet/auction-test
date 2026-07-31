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

/** Кнопка переключает по кругу: системная → светлая → тёмная → системная. */
export function nextPreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length] ?? 'system';
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Как в системе',
  light: 'Светлая тема',
  dark: 'Тёмная тема',
};

/** Класс на <html> — единственный переключатель палитры; токены живут в index.css. */
export function applyThemeClass(theme: ResolvedTheme, root: HTMLElement): void {
  root.classList.toggle('dark', theme === 'dark');
}
