import { describe, expect, it } from 'vitest';

import {
  applyThemeClass,
  resolveTheme,
  THEME_LABELS,
  THEME_PREFERENCES,
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

describe('THEME_LABELS', () => {
  it('подпись есть у каждого варианта: они видны на кнопках и в aria-label', () => {
    for (const preference of THEME_PREFERENCES) {
      expect(THEME_LABELS[preference]).toBeTruthy();
    }
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
