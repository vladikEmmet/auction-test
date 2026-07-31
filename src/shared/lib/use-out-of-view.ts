import { useEffect, useState, type RefObject } from 'react';

export function useOutOfView(ref: RefObject<Element | null>): boolean {
  const [isOutOfView, setIsOutOfView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsOutOfView(entry ? !entry.isIntersecting : false),
      { threshold: 0 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return isOutOfView;
}
