import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { act, render, type RenderResult } from '@testing-library/react';
import { Toaster } from 'sonner';

import { routeTree } from '@/app/router';

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

        <Toaster />
      </QueryClientProvider>,
    );
  });

  return { ...utils, router, queryClient };
}
