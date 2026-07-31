export const API_BASE_URL = '/api/v1';

export const IS_DEV = import.meta.env.DEV;

export const CURRENT_USER = {
  subscriberId: 13,
  subscriberCode: '54321',
  organizationId: 14,
  organizationInn: '9616244307',
  organizationName: 'ООО Перевозчик',
  contactName: 'Иванов Иван',
  contactPhone: '+79001234567',
} as const;
