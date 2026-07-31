import { describe, expect, it } from 'vitest';

import {
  applyThemeClass,
  nextPreference,
  resolveTheme,
  THEME_PREFERENCES,
  type ThemePreference,
} from '@/features/theme/model/theme';

describe('resolveTheme', () => {
  it('явный выбор не зависит от системной темы', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('системная тема разворачивается в предпочтение ОС', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('nextPreference', () => {
  it('переключает по кругу и возвращается к началу', () => {
    expect(nextPreference('system')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
  });

  it('обходит все варианты ровно за один круг', () => {
    let preference: ThemePreference = THEME_PREFERENCES[0];
    const visited = new Set<ThemePreference>([preference]);

    for (let step = 0; step < THEME_PREFERENCES.length - 1; step += 1) {
      preference = nextPreference(preference);
      visited.add(preference);
    }

    expect(visited.size).toBe(THEME_PREFERENCES.length);
    expect(nextPreference(preference)).toBe(THEME_PREFERENCES[0]);
  });
});

describe('applyThemeClass', () => {
  it('ставит и снимает класс dark', () => {
    const root = document.createElement('html');

    applyThemeClass('dark', root);
    expect(root.classList.contains('dark')).toBe(true);

    applyThemeClass('light', root);
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('повторный вызов не плодит дубликаты класса', () => {
    const root = document.createElement('html');

    applyThemeClass('dark', root);
    applyThemeClass('dark', root);

    expect(root.className).toBe('dark');
  });
});
