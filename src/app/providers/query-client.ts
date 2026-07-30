import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/shared/api/api-error';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Повторяем только сетевые и 5xx-ошибки: 4xx повтором не исправить.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}

/**
 * Синглтон приложения. Роутер регистрируется в типах TanStack Router на уровне модуля,
 * поэтому и клиент запросов создаётся здесь, а не внутри компонента: иначе вывод типов
 * маршрутов зацикливается на Register.
 */
export const queryClient = createQueryClient();
