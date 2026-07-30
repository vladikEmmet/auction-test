import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app.component';
import '@/app/styles/index.css';
import { startMockServer } from '@/shared/api/msw/browser';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Не найден #root: проверьте index.html');

// Приложение стартует только после запуска MSW, иначе первые запросы уйдут мимо моков.
void startMockServer().then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
