import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app.component';
import '@/app/styles/index.css';

function requireRootElement(): HTMLElement {
  const element = document.getElementById('root');
  if (!element) throw new Error('Не найден #root: проверьте index.html');
  return element;
}

/**
 * Приложение стартует только после запуска MSW, иначе первые запросы уйдут мимо моков.
 * Импорт динамический: моки и их сид уезжают в отдельный чанк, а не в основной бандл.
 */
async function bootstrap() {
  const { startMockServer } = await import('@/shared/api/msw/browser');
  await startMockServer();

  createRoot(requireRootElement()).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
