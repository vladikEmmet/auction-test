const EMPTY = '—';

export const DEFAULT_CURRENCY = 'RUB';

const ISO_4217_NUMERIC_TO_ALPHA: Record<string, string> = {
  '643': 'RUB',
  '840': 'USD',
  '978': 'EUR',
  '398': 'KZT',
  '933': 'BYN',
  '156': 'CNY',
  '944': 'AZN',
  '051': 'AMD',
  '981': 'GEL',
  '860': 'UZS',
};

export function currencyFromCode(code: string | number | null | undefined): string {
  if (code == null) return DEFAULT_CURRENCY;
  const normalized = String(code).padStart(3, '0');
  return ISO_4217_NUMERIC_TO_ALPHA[normalized] ?? DEFAULT_CURRENCY;
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: string, precise: boolean): Intl.NumberFormat {
  const key = `${currency}:${precise}`;
  let formatter = moneyFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      ...(precise
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumFractionDigits: 0 }),
    });
    moneyFormatters.set(key, formatter);
  }

  return formatter;
}

const numberFormatter = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 3,
});

export function formatEmpty(value: string | null | undefined): string {
  return value == null || value === '' ? EMPTY : value;
}

export type MoneyOptions = {
  currency?: string;

  precise?: boolean;
};

export function formatMoney(value: number | null | undefined, options: MoneyOptions = {}): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  return moneyFormatter(options.currency ?? DEFAULT_CURRENCY, options.precise ?? false).format(
    value,
  );
}

export function formatNumber(value: number | null | undefined, unit?: string): string {
  if (value == null || !Number.isFinite(value)) return EMPTY;
  const formatted = numberFormatter.format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = parseApiDate(value);
  if (!date) return EMPTY;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
