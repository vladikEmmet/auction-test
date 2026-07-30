import { describe, expect, it } from 'vitest';

import { formatTimeLeft, getTimeLeft } from '@/shared/lib/time-left';

const NOW = new Date('2026-07-30T12:00:00');
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('getTimeLeft', () => {
  it('считает остаток до даты в будущем', () => {
    const result = getTimeLeft('2026-07-30T13:30:00', NOW);
    expect(result.isExpired).toBe(false);
    expect(result.isUnknown).toBe(false);
    expect(result.ms).toBe(90 * MINUTE);
    expect(result.label).toBe('1 ч 30 мин');
  });

  it('дату в прошлом считает истёкшей', () => {
    const result = getTimeLeft('2026-07-30T11:59:59', NOW);
    expect(result.isExpired).toBe(true);
    expect(result.ms).toBe(0);
    expect(result.label).toBe('время вышло');
  });

  it('ровно текущий момент — уже истёк', () => {
    expect(getTimeLeft('2026-07-30T12:00:00', NOW).isExpired).toBe(true);
  });

  it('помечает срочность за пять минут до конца', () => {
    expect(getTimeLeft('2026-07-30T12:04:00', NOW).isUrgent).toBe(true);
    expect(getTimeLeft('2026-07-30T12:06:00', NOW).isUrgent).toBe(false);
  });

  it('пустую или битую дату отдаёт как неизвестную, а не как истёкшую', () => {
    for (const value of [null, undefined, '', 'вчера']) {
      const result = getTimeLeft(value, NOW);
      expect(result.isUnknown).toBe(true);
      expect(result.isExpired).toBe(false);
    }
  });

  it('принимает now числом — так его отдаёт Date.now()', () => {
    expect(getTimeLeft('2026-07-30T12:01:00', NOW.getTime()).ms).toBe(MINUTE);
  });
});

describe('formatTimeLeft', () => {
  it('показывает две старшие единицы', () => {
    expect(formatTimeLeft(3 * DAY + 5 * HOUR)).toBe('3 дн 5 ч');
    expect(formatTimeLeft(2 * HOUR + 15 * MINUTE)).toBe('2 ч 15 мин');
    expect(formatTimeLeft(5 * MINUTE + 7_000)).toBe('5 мин 07 сек');
    expect(formatTimeLeft(42_000)).toBe('42 сек');
  });

  it('опускает нулевую младшую единицу', () => {
    expect(formatTimeLeft(2 * DAY)).toBe('2 дн');
    expect(formatTimeLeft(3 * HOUR)).toBe('3 ч');
  });

  it('ноль и отрицательное время — уже вышло', () => {
    expect(formatTimeLeft(0)).toBe('время вышло');
    expect(formatTimeLeft(-1000)).toBe('время вышло');
  });
});
