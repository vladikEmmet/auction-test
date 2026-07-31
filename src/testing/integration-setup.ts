import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { useThemeStore } from '@/features/theme';
import { server } from '@/shared/api/msw/node';
import { createSeed } from '@/shared/api/msw/seed';
import { resetStore } from '@/shared/api/msw/store';

/**
 * Общий бутстрап интеграционных тестов: MSW-сервер и чистая мок-база перед каждым тестом.
 * Подключается импортом `import '@/testing/integration-setup'` в файле теста — глобальным
 * setupFiles делать нельзя, иначе сервер поднимался бы и для юнит-тестов чистой логики.
 *
 * `onUnhandledRequest: 'error'` намеренно: незамоканный запрос должен падать тестом,
 * а не уходить в сеть.
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  // Сид строится от текущего момента: у UI есть обратный отсчёт, торги должны быть живыми.
  resetStore(createSeed(new Date()));

  // Персистентные сторы (тема, режим НДС) живут в модулях и localStorage — сбрасываем,
  // иначе выбор из одного теста протекает в следующий.
  localStorage.clear();
  useThemeStore.setState({ preference: 'system' });
  document.documentElement.classList.remove('dark');
});
