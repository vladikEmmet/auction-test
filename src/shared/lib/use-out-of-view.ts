import { useEffect, useState, type RefObject } from 'react';

/**
 * Следит, ушёл ли элемент из области видимости. Используется, чтобы показать компактную
 * кнопку только тогда, когда развёрнутая панель уже прокручена: пока панель на экране,
 * дублировать её кнопкой незачем.
 *
 * IntersectionObserver, а не слушатель scroll: не зависит от высоты панели и не дёргает
 * обработчик на каждый пиксель прокрутки. Если API недоступно (старый браузер, jsdom
 * без заглушки), элемент считается видимым — деградация в прежнее поведение.
 */
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
