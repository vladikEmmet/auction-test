import { useEffect, useState } from 'react';

import { getTimeLeft, type TimeLeft } from '@/shared/lib/time-left';

/** Реже секунды тикать незачем, чаще — бессмысленно: подпись обновляется раз в секунду. */
const TICK_MS = 1000;

/**
 * Живой обратный отсчёт до даты из DTO.
 *
 * Значение вычисляется во время рендера, а таймер только просит перерисовку — поэтому
 * нет рассинхрона состояния с пропсом и нет setState в теле эффекта. Тик останавливается,
 * как только время вышло, чтобы не жечь рендеры на завершённых аукционах.
 */
export function useTimeLeft(target: string | null | undefined): TimeLeft {
  // Текущее время живёт в состоянии: читать Date.now() во время рендера нельзя,
  // это внешний изменяемый источник (правило react-hooks/purity).
  const [now, setNow] = useState(Date.now);
  const timeLeft = getTimeLeft(target, now);
  const isStopped = timeLeft.isExpired || timeLeft.isUnknown;

  useEffect(() => {
    if (isStopped) return;

    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [target, isStopped]);

  return timeLeft;
}
