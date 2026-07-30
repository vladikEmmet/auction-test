import { ClockIcon } from 'lucide-react';

import type { TimeLeft } from '@/shared/lib/time-left';
import { Badge, type BadgeProps } from '@/shared/ui/badge.component';

type TimeLeftBadgeProps = {
  timeLeft: TimeLeft;
  /** Подпись перед временем: «До конца торгов», «До начала». */
  prefix?: string;
  expiredLabel?: string;
  className?: string;
};

/**
 * Обратный отсчёт до конца торгов. `aria-live="off"` осознанно: секундные обновления
 * скринридеру не нужны, время дублируется рядом обычным текстом.
 */
export function TimeLeftBadge({
  timeLeft,
  prefix = 'До конца',
  expiredLabel = 'Торги завершены',
  className,
}: TimeLeftBadgeProps) {
  if (timeLeft.isUnknown) return null;

  const variant: BadgeProps['variant'] = timeLeft.isExpired
    ? 'neutral'
    : timeLeft.isUrgent
      ? 'destructive'
      : 'warning';

  return (
    <Badge variant={variant} className={className} aria-live="off">
      <ClockIcon className="size-3" aria-hidden />
      {timeLeft.isExpired ? expiredLabel : `${prefix}: ${timeLeft.label}`}
    </Badge>
  );
}
