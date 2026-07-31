import { z } from 'zod';

import { AUCTION_STATUSES, FILTER_AUCTION_TYPES, TRADING_STATUSES } from '@/shared/api/contracts';
import { isKnownCity } from '@/shared/config/cities';

export const PER_PAGE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PER_PAGE = 20;

export const SORT_OPTIONS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'per_km_asc',
  'per_km_desc',
  'start_time_asc',
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
export type PerPageOption = (typeof PER_PAGE_OPTIONS)[number];

const perPageSchema = z.coerce
  .number()
  .int()
  .refine((value): value is PerPageOption =>
    (PER_PAGE_OPTIONS as readonly number[]).includes(value),
  )
  .catch(DEFAULT_PER_PAGE);

const sortSchema = z.enum(SORT_OPTIONS).catch('newest');

export function parseSortOption(value: unknown): SortOption {
  return sortSchema.parse(value);
}

export function parsePerPage(value: unknown): PerPageOption {
  return perPageSchema.parse(value);
}

export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Сначала новые',
  oldest: 'Сначала старые',
  price_asc: 'Цена ↑',
  price_desc: 'Цена ↓',
  per_km_asc: 'Цена за км ↑',
  per_km_desc: 'Цена за км ↓',
  start_time_asc: 'Начало торгов ↑',
};

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), 'invalid date');

const trimmedText = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().min(1));

const positiveMoney = z.coerce.number().finite().nonnegative();

const cityName = trimmedText.refine(isKnownCity, 'unknown city');

export const auctionsSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  per_page: perPageSchema,
  sort: sortSchema,

  cargo_num: trimmedText.optional().catch(undefined),
  status: z.array(z.enum(TRADING_STATUSES)).nonempty().optional().catch(undefined),
  statuses: z.array(z.enum(AUCTION_STATUSES)).nonempty().optional().catch(undefined),
  auc_type: z.array(z.enum(FILTER_AUCTION_TYPES)).nonempty().optional().catch(undefined),

  load_city: cityName.optional().catch(undefined),
  unload_city: cityName.optional().catch(undefined),

  load_date_from: dateOnly.optional().catch(undefined),
  load_date_to: dateOnly.optional().catch(undefined),

  is_available: z.boolean().optional().catch(undefined),
  is_bidder: z.boolean().optional().catch(undefined),

  price_from: positiveMoney.optional().catch(undefined),
  price_to: positiveMoney.optional().catch(undefined),
});

export type AuctionsSearch = z.infer<typeof auctionsSearchSchema>;

export function parseAuctionsSearch(input: unknown): AuctionsSearch {
  const result = auctionsSearchSchema.safeParse(input ?? {});

  return result.success ? result.data : auctionsSearchSchema.parse({});
}

export const DEFAULT_SEARCH: AuctionsSearch = auctionsSearchSchema.parse({});

export function hasActiveFilters(search: AuctionsSearch): boolean {
  const { page: _page, per_page: _perPage, sort: _sort, ...filters } = search;
  return Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  );
}

export function clearFilters(search: AuctionsSearch): AuctionsSearch {
  return { page: 1, per_page: search.per_page, sort: search.sort };
}
