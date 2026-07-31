import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app.component';
import '@/app/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Не найден #root: проверьте index.html');

/**
 * Приложение стартует только после запуска MSW, иначе первые запросы уйдут мимо моков.
 * Импорт динамический: моки и их сид уезжают в отдельный чанк, а не в основной бандл.
 */
async function bootstrap() {
  const { startMockServer } = await import('@/shared/api/msw/browser');
  await startMockServer();

  createRoot(rootElement!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
