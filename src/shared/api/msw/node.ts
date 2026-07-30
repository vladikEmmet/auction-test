import { setupServer } from 'msw/node';

import { handlers } from '@/shared/api/msw/handlers';

/** MSW-сервер для интеграционных тестов (в jsdom нет service worker'а). */
export const server = setupServer(...handlers);
