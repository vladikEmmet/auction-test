import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { act, render, type RenderResult } from '@testing-library/react';

import { routeTree } from '@/app/router';

/**
 * Поднимает приложение в памяти для интеграционных тестов: своя история, свой QueryClient
 * (кэш не протекает между тестами) и отключённые ретраи, чтобы ошибки всплывали сразу.
 *
 * Рендер обёрнут в act: первый переход роутера асинхронный, без обёртки React ругается
 * на обновления состояния вне act и до первого await в DOM ничего нет.
 */
export async function renderApp(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultPreload: false,
  });

  let utils!: RenderResult;
  await act(async () => {
    utils = render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  });

  return { ...utils, router, queryClient };
}
