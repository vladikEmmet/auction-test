import { setupWorker } from 'msw/browser';

import { handlers } from '@/shared/api/msw/handlers';
import { createSeed } from '@/shared/api/msw/seed';
import { resetStore } from '@/shared/api/msw/store';

export const worker = setupWorker(...handlers);

const CONTROLLER_TIMEOUT_MS = 3000;

function waitForController(): Promise<void> {
  const container = navigator.serviceWorker as ServiceWorkerContainer | undefined;

  if (!container || container.controller) return Promise.resolve();

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      container.removeEventListener('controllerchange', finish);
      resolve();
    };

    const timer = setTimeout(finish, CONTROLLER_TIMEOUT_MS);
    container.addEventListener('controllerchange', finish);
  });
}

export async function startMockServer(): Promise<void> {
  resetStore(createSeed());

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });

  await waitForController();

  if (!navigator.serviceWorker?.controller) {
    console.warn(
      '[msw] Service worker не управляет страницей: запросы уйдут в сеть. Перезагрузите страницу.',
    );
  }
}
