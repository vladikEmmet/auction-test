import { setupWorker } from 'msw/browser';

import { handlers } from '@/shared/api/msw/handlers';
import { createSeed } from '@/shared/api/msw/seed';
import { resetStore } from '@/shared/api/msw/store';

export const worker = setupWorker(...handlers);

export async function startMockServer(): Promise<void> {
  resetStore(createSeed());
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
