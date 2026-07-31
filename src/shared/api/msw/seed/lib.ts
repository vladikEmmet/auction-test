export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** Детерминированный PRNG: одинаковый сид — одинаковые данные между перезапусками. */
export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** API отдаёт даты без смещения: `2026-05-26T09:00:00`. */
export function apiDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function uuidFor(index: number): string {
  const tail = String(index + 1).padStart(12, '0');
  return `a0000000-0000-4000-8000-${tail}`;
}

/** Циклический выбор из справочника: данные распределяются равномерно и предсказуемо. */
export function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  // Остаток от деления всегда даёт валидный индекс — undefined тут означает пустой справочник.
  if (item === undefined) throw new Error('pick: справочник пуст');
  return item;
}
