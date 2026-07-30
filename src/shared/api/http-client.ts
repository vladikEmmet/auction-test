import type { z } from 'zod';

import { ApiError, toApiError } from '@/shared/api/api-error';
import { API_BASE_URL, IS_DEV } from '@/shared/config/env';

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Разбор ответа схемой Zod. В dev расхождение с контрактом печатается в консоль,
 * но не роняет экран: реальный upstream может добавить поля или прислать null там,
 * где схема этого не обещала. В тестах и проде используются уже разобранные данные.
 */
function parseWithContract<T extends z.ZodType>(schema: T, data: unknown, path: string): z.infer<T> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  if (IS_DEV) {
    console.warn(
      `[contract] Ответ ${path} не соответствует схеме:`,
      result.error.issues.slice(0, 10),
    );
  }
  return data as z.infer<T>;
}

export async function apiRequest<T extends z.ZodType>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  const { method = 'GET', body, query, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError({
      status: 0,
      code: 'network_error',
      title: 'Нет соединения',
      message: 'Не удалось связаться с сервисом. Проверьте соединение и повторите запрос.',
    });
  }

  const payload = await readBody(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return parseWithContract(schema, payload, path);
}
