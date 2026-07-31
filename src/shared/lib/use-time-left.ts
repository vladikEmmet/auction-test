import { useEffect, useState } from 'react';

import { getTimeLeft, type TimeLeft } from '@/shared/lib/time-left';

const TICK_MS = 1000;

export function useTimeLeft(target: string | null | undefined): TimeLeft {
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
