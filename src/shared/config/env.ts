/** Базовый путь из `servers` в OpenAPI-схеме. */
export const API_BASE_URL = '/api/v1';

export const IS_DEV = import.meta.env.DEV;

/** Организация текущего пользователя — от неё зависят «моя ставка» и торговый статус. */
export const CURRENT_USER = {
  subscriberId: 13,
  subscriberCode: '54321',
  organizationId: 14,
  organizationInn: '9616244307',
  organizationName: 'ООО Перевозчик',
  contactName: 'Иванов Иван',
  contactPhone: '+79001234567',
} as const;
