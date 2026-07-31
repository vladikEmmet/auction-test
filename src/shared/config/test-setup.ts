import '@testing-library/jest-dom/vitest';

import { configure } from '@testing-library/dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import {
  installIntersectionObserverStub,
  resetIntersectionObserverStub,
} from '@/testing/intersection-observer';

configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  resetIntersectionObserverStub();
  installIntersectionObserverStub();
});

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

  Object.defineProperty(globalThis, 'DOMRect', {
    writable: true,
    value: DOMRectStub,
  });
}

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
}
