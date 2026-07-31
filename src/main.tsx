import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app.component';
import '@/app/styles/index.css';

function requireRootElement(): HTMLElement {
  const element = document.getElementById('root');
  if (!element) throw new Error('Не найден #root: проверьте index.html');
  return element;
}

function removeBootShell(): void {
  document.getElementById('boot')?.remove();
}

async function bootstrap() {
  const { startMockServer } = await import('@/shared/api/msw/browser');
  await startMockServer();

  createRoot(requireRootElement()).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  requestAnimationFrame(removeBootShell);
}

void bootstrap();
