import { parseApiDate } from '@/shared/lib/format';

export type TimeLeft = {
  /** Миллисекунд до окончания; 0, если время вышло или дата неизвестна. */
  ms: number;
  /** Торги закончились: дата в прошлом. */
  isExpired: boolean;
  /** Дата не разобралась — таймер показывать нечему. */
  isUnknown: boolean;
  /** Меньше пяти минут: повод подсветить. */
  isUrgent: boolean;
  /** Подпись вида «1 ч 23 мин», «4 дн 2 ч», «43 сек». */
  label: string;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const URGENT_THRESHOLD = 5 * MINUTE;

const EXPIRED: TimeLeft = {
  ms: 0,
  isExpired: true,
  isUnknown: false,
  isUrgent: false,
  label: 'время вышло',
};

const UNKNOWN: TimeLeft = {
  ms: 0,
  isExpired: false,
  isUnknown: true,
  isUrgent: false,
  label: '—',
};

/**
 * Чистый расчёт остатка времени: `now` передаётся параметром, поэтому функция
 * тестируется без подмены системных часов.
 */
export function getTimeLeft(target: string | null | undefined, now: Date | number): TimeLeft {
  const date = parseApiDate(target);
  if (!date) return UNKNOWN;

  const ms = date.getTime() - (typeof now === 'number' ? now : now.getTime());
  if (ms <= 0) return EXPIRED;

  return {
    ms,
    isExpired: false,
    isUnknown: false,
    isUrgent: ms <= URGENT_THRESHOLD,
    label: formatTimeLeft(ms),
  };
}

/** Две старшие единицы: точность до секунд нужна только на последней минуте. */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'время вышло';

  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  const seconds = Math.floor((ms % MINUTE) / SECOND);

  if (days > 0) return hours > 0 ? `${days} дн ${hours} ч` : `${days} дн`;
  if (hours > 0) return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  if (minutes > 0) return `${minutes} мин ${String(seconds).padStart(2, '0')} сек`;
  return `${seconds} сек`;
}
