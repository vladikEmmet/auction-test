import { delay, http, HttpResponse } from 'msw';

import {
  auctionListRequestSchema,
  setBetRequestSchema,
  type ProblemDetailDto,
  type ValidationErrorDto,
  type ValidationProblemDto,
} from '@/shared/api/contracts';
import { API_BASE_URL } from '@/shared/config/env';
import { getAuction, getBets, listAuctions, placeBet } from '@/shared/api/msw/store';

/** Задержка, чтобы skeleton-состояния были видимы при ручной проверке; в тестах отключена. */
const LATENCY_MS = import.meta.env.MODE === 'test' ? { min: 0, max: 0 } : { min: 180, max: 520 };

const PROBLEM_HEADERS = { 'Content-Type': 'application/problem+json' };

function problem(status: number, body: ProblemDetailDto) {
  return HttpResponse.json(body, { status, headers: PROBLEM_HEADERS });
}

function validationProblem(errors: ValidationErrorDto[]) {
  const body: ValidationProblemDto = {
    code: 'validation_failed',
    title: 'Ошибка валидации',
    message: 'Запрос содержит некорректные поля.',
    trace_id: crypto.randomUUID().replaceAll('-', ''),
    errors,
  };
  return HttpResponse.json(body, { status: 422, headers: PROBLEM_HEADERS });
}

function notFound(message: string) {
  return problem(404, {
    code: 'resource_not_found',
    title: 'Не найдено',
    message,
    trace_id: crypto.randomUUID().replaceAll('-', ''),
  });
}

async function randomLatency(): Promise<void> {
  if (LATENCY_MS.max === 0) return;
  await delay(LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min));
}

export const handlers = [
  http.post(`${API_BASE_URL}/auctions/list`, async ({ request }) => {
    await randomLatency();

    const raw = await request.json().catch(() => ({}));
    const parsed = auctionListRequestSchema.safeParse(raw ?? {});

    if (!parsed.success) {
      return validationProblem(
        parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
          code: issue.code,
        })),
      );
    }

    const filters = parsed.data;
    const perPage = filters.per_page ?? 20;
    const page = filters.page ?? 1;

    // Границы пагинации проверяются как на реальном сервисе (см. пример ValidationError).
    const errors: ValidationErrorDto[] = [];
    if (perPage < 1 || perPage > 100) {
      errors.push({
        field: 'per_page',
        message: 'Значение должно быть от 1 до 100.',
        code: 'max_value',
      });
    }
    if (page < 1) {
      errors.push({ field: 'page', message: 'Значение должно быть не меньше 1.', code: 'min_value' });
    }
    if (errors.length > 0) return validationProblem(errors);

    return HttpResponse.json(listAuctions(filters));
  }),

  http.get(`${API_BASE_URL}/auctions/:auctionUuid`, async ({ params }) => {
    await randomLatency();

    const auction = getAuction(String(params.auctionUuid));
    if (!auction) return notFound('Аукцион не найден.');

    return HttpResponse.json(auction);
  }),

  http.get(`${API_BASE_URL}/auctions/:auctionUuid/bets`, async ({ params, request }) => {
    await randomLatency();

    const all = new URL(request.url).searchParams.get('all') === 'true';
    const bets = getBets(String(params.auctionUuid), all);
    if (!bets) return notFound('Аукцион не найден.');

    return HttpResponse.json({ bets });
  }),

  http.post(`${API_BASE_URL}/auctions/:auctionUuid/bets`, async ({ params, request }) => {
    await randomLatency();

    const raw = await request.json().catch(() => null);
    const parsed = setBetRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return validationProblem([
        { field: 'price', message: 'Цена ставки обязательна и должна быть числом.', code: 'invalid' },
      ]);
    }

    const result = placeBet(String(params.auctionUuid), parsed.data.price);
    if (!result) return notFound('Аукцион не найден.');
    if (!result.ok) return validationProblem(result.errors);

    // Схема не типизирует тело успешного ответа («проксируется от upstream»),
    // поэтому возвращаем созданную ставку — клиент на неё не опирается.
    return HttpResponse.json(result.bet, { status: 200 });
  }),
];
