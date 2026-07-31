type StubInstance = {
  callback: IntersectionObserverCallback;
  elements: Set<Element>;
  observer: IntersectionObserver;
};

const instances = new Set<StubInstance>();

/**
 * Заглушка IntersectionObserver для jsdom: в нём этого API нет, а от него зависит
 * появление липкой кнопки фильтров. По умолчанию наблюдаемые элементы считаются видимыми —
 * это соответствует состоянию «страница только открылась».
 */
export function installIntersectionObserverStub(): void {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [0];

    private readonly instance: StubInstance;

    constructor(callback: IntersectionObserverCallback) {
      this.instance = { callback, elements: new Set(), observer: this };
      instances.add(this.instance);
    }

    observe(element: Element): void {
      this.instance.elements.add(element);
    }

    unobserve(element: Element): void {
      this.instance.elements.delete(element);
    }

    disconnect(): void {
      instances.delete(this.instance);
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver = IntersectionObserverStub;
}

/**
 * Имитирует прокрутку: сообщает всем наблюдателям, ушли ли элементы из области видимости.
 * Вызывать внутри `act`, потому что коллбэк меняет состояние React.
 */
export function setObservedElementsVisible(isIntersecting: boolean): void {
  for (const instance of instances) {
    const entries = [...instance.elements].map(
      (target) =>
        ({
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: new DOMRect(),
          intersectionRect: new DOMRect(),
          rootBounds: null,
          time: 0,
        }) as IntersectionObserverEntry,
    );

    instance.callback(entries, instance.observer);
  }
}

export function resetIntersectionObserverStub(): void {
  instances.clear();
}
