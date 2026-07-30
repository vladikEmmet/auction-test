import {
  problemDetailSchema,
  validationProblemSchema,
  type ValidationErrorDto,
} from '@/shared/api/contracts';

/**
 * Единая ошибка API: и `ProblemDetail`, и `ValidationProblem` из схемы, и сетевой сбой
 * приводятся к одному типу, чтобы UI не разбирал форматы вручную.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly traceId: string | null;
  readonly errors: ValidationErrorDto[];

  constructor(params: {
    status: number;
    code: string;
    title: string;
    message: string;
    traceId?: string | null;
    errors?: ValidationErrorDto[];
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.title = params.title;
    this.traceId = params.traceId ?? null;
    this.errors = params.errors ?? [];
  }

  /** 422 с разбором по полям — единственный случай, который форма раскладывает по инпутам. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Разбирает тело ошибки: сначала как ValidationProblem, затем как ProblemDetail. */
export function toApiError(status: number, body: unknown): ApiError {
  const validation = validationProblemSchema.safeParse(body);
  if (validation.success) {
    return new ApiError({
      status,
      code: validation.data.code,
      title: validation.data.title,
      message: validation.data.message,
      traceId: validation.data.trace_id,
      errors: validation.data.errors,
    });
  }

  const problem = problemDetailSchema.safeParse(body);
  if (problem.success) {
    return new ApiError({
      status,
      code: problem.data.code,
      title: problem.data.title,
      message: problem.data.message,
      traceId: problem.data.trace_id,
    });
  }

  return new ApiError({
    status,
    code: 'unexpected_error',
    title: 'Ошибка запроса',
    message: `Сервис вернул неожиданный ответ (HTTP ${status}).`,
  });
}
