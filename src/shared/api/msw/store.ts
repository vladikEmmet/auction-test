/**
 * Публичный API мок-базы. Внутри разделён по обязанностям:
 * `db` — состояние, `projections` — DTO списка из детального, `queries` — выборки,
 * `mutations` — изменения состояния, `vat` — арифметика НДС.
 */
export {
  findRecord,
  getRecords,
  resetStore,
  type AuctionRecord,
} from '@/shared/api/msw/db';
export { toListItem } from '@/shared/api/msw/projections';
export { getAuction, getBets, listAuctions } from '@/shared/api/msw/queries';
export { placeBet, type PlaceBetResult } from '@/shared/api/msw/mutations';
export { VAT_RATE, withoutVat } from '@/shared/api/msw/vat';
