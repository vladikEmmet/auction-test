const EMPTY = '—';

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const moneyPreciseFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });

/** Прочерк вместо пустого значения: nullable-полей в схеме много, показывать «null» нельзя. */
export function formatEmpty(value: string | null | undefined): string {
  return value == null || value === '' ? EMPTY : value;
}

export function formatMoney(value: number | null | undefined, precise = false): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return precise ? moneyPreciseFormatter.format(value) : moneyFormatter.format(value);
}

export function formatNumber(value: number | null | undefined, unit?: string): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  const formatted = numberFormatter.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Даты в API приходят без таймзоны (`2026-05-26T09:00:00`) — это локальное время
 * организатора. `new Date()` в этом случае трактует строку как локальную, что нам и нужно;
 * добавлять смещение нельзя, иначе поедут часы погрузки.
 */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateRange(
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  const start = formatDateTime(from);
  const end = formatDateTime(to);
  if (start === EMPTY) return end;
  if (end === EMPTY || start === end) return start;
  return `${start} — ${end}`;
}

export { EMPTY };
