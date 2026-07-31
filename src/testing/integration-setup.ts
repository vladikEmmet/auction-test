import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { useThemeStore } from '@/features/theme';
import { server } from '@/shared/api/msw/node';
import { createSeed } from '@/shared/api/msw/seed';
import { resetStore } from '@/shared/api/msw/store';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  resetStore(createSeed(new Date()));

  localStorage.clear();
  useThemeStore.setState({ preference: 'system' });
  document.documentElement.classList.remove('dark');
});
