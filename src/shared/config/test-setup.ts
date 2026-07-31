import '@testing-library/jest-dom/vitest';

import { configure } from '@testing-library/dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import {
  installIntersectionObserverStub,
  resetIntersectionObserverStub,
} from '@/testing/intersection-observer';

/**
 * Дефолтный таймаут findBy/waitFor — 1 секунда. С ленивой загрузкой страниц первому
 * рендеру нужно ещё и разрешить динамический импорт чанка, и под нагрузкой (параллельные
 * tsc/eslint/build на той же машине) секунды иногда не хватало — тесты падали хаотично.
 * Ожидание всё равно завершается сразу после выполнения условия, запас на время не влияет.
 */
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  resetIntersectionObserverStub();
  installIntersectionObserverStub();
});

/**
 * jsdom не реализует API, на которые опираются примитивы Radix (Select, Popover, Dialog).
 * Без этих заглушек компоненты падают при монтировании, хотя в браузере работают.
 */
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!('DOMRect' in globalThis)) {
  class DOMRectStub {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    get top() {
      return this.y;
    }
    get left() {
      return this.x;
    }
    get right() {
      return this.x + this.width;
    }
    get bottom() {
      return this.y + this.height;
    }
  }

  Object.defineProperty(globalThis, 'DOMRect', { writable: true, value: DOMRectStub });
}

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
}
