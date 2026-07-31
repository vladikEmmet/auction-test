import type { AuctionType, BetItemDto, ValidationErrorDto } from '@/shared/api/contracts';
import { CURRENT_USER } from '@/shared/config/env';
import {
  getBetConstraintsFromDto,
  isBetterBet,
  roundMoney,
  validateBetPrice,
} from '@/shared/lib/bet-rules';
import { allocateBetId, findRecord, type AuctionRecord } from '@/shared/api/msw/db';
import { VAT_RATE, withoutVat } from '@/shared/api/msw/vat';

/** Пересчитывает места: рейтинг строится по лучшей активной ставке каждой организации. */
function recalculatePlaces(record: AuctionRecord): void {
  const aucType: AuctionType = record.detail.main.auc_type;
  const active = record.bets.filter((bet) => !bet.is_rejected);

  const bestByOrganization = new Map<number, BetItemDto>();
  for (const bet of active) {
    const current = bestByOrganization.get(bet.organization_id);
    if (!current || isBetterBet(bet.price_with_vat, current.price_with_vat, aucType)) {
      bestByOrganization.set(bet.organization_id, bet);
    }
  }

  const ranked = [...bestByOrganization.values()].sort((a, b) =>
    isBetterBet(a.price_with_vat, b.price_with_vat, aucType) ? -1 : 1,
  );
  const placeByBetId = new Map(ranked.map((bet, index) => [bet.id, index + 1]));

  for (const bet of record.bets) {
    bet.place = bet.is_rejected ? null : (placeByBetId.get(bet.id) ?? null);
  }
}

export type PlaceBetResult =
  | { ok: true; bet: BetItemDto }
  | { ok: false; errors: ValidationErrorDto[] };

export function placeBet(uuid: string, price: number): PlaceBetResult | undefined {
  const record = findRecord(uuid);
  if (!record) return undefined;

  const constraints = getBetConstraintsFromDto(record.detail);

  if (!constraints.canSetBet) {
    return {
      ok: false,
      errors: [
        {
          field: 'price',
          message: 'Ставки в этом аукционе сейчас недоступны.',
          code: 'bet_not_allowed',
        },
      ],
    };
  }

  const errors = validateBetPrice(price, constraints);
  if (errors.length > 0) return { ok: false, errors };

  const trading = record.detail.trading;
  const priceWithVat = roundMoney(price);
  const priceNoVat = withoutVat(priceWithVat);

  const bet: BetItemDto = {
    id: allocateBetId(),
    created_at: new Date().toISOString().slice(0, 19),
    auction_id: record.detail.main.id,
    subscriber_id: CURRENT_USER.subscriberId,
    contact_name: CURRENT_USER.contactName,
    contact_phone: CURRENT_USER.contactPhone,
    price_with_vat: priceWithVat,
    price_no_vat: priceNoVat,
    organization_id: CURRENT_USER.organizationId,
    organization_inn: CURRENT_USER.organizationInn,
    organization_name: CURRENT_USER.organizationName,
    transporter_comment: null,
    is_rejected: false,
    is_counter: false,
    place: null,
    is_win: false,
    run_number: 0,
    cancel_reason: '',
    price_info: {
      price_with_vat: priceWithVat,
      price_no_vat: priceNoVat,
      payment_type: record.detail.payment.form,
      vat_rate: String(VAT_RATE * 100),
    },
  };

  record.bets.push(bet);
  recalculatePlaces(record);

  // Текущая цена аукциона двигается к последней ставке.
  trading.price.current = priceWithVat;
  trading.price.current_no_vat = priceNoVat;
  trading.price.price_per_km = record.detail.cargo.distance
    ? roundMoney(priceNoVat / record.detail.cargo.distance)
    : 0;

  const step = trading.price.step ?? 0;
  if (step > 0) {
    const next =
      record.detail.main.auc_type === 'Up' ? priceWithVat + step : priceWithVat - step;
    trading.price.available = next > 0 ? roundMoney(next) : priceWithVat;
  } else {
    trading.price.available = priceWithVat;
  }
  trading.price.available_no_vat =
    trading.price.available == null ? null : withoutVat(trading.price.available);

  trading.your = {
    bet: true,
    last_bet: priceNoVat,
    last_bet_with_vat: priceWithVat,
    win: false,
  };
  trading.is_bidder = true;
  trading.is_last_bet_with_vat = true;
  trading.status_mobile = bet.place === 1 ? 'Leading' : 'Losing';

  record.list.hasYourBlock = true;
  record.list.hasPriceBlock = true;

  return { ok: true, bet };
}
