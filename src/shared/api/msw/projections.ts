import type {
  AuctionListItemDto,
  ListTradingStatus,
  TradingStatus,
} from '@/shared/api/contracts';
import { LIST_TRADING_STATUSES } from '@/shared/api/contracts';
import { roundMoney } from '@/shared/lib/bet-rules';
import type { AuctionRecord } from '@/shared/api/msw/db';
import { withoutVat } from '@/shared/api/msw/vat';

function toListTradingStatus(status: TradingStatus): ListTradingStatus {
  return (LIST_TRADING_STATUSES as readonly string[]).includes(status)
    ? (status as ListTradingStatus)
    : 'Unknown';
}

function sumRouteCargo(record: AuctionRecord, field: 'weight' | 'volume'): number {
  return roundMoney(
    record.detail.routes
      .filter((point) => point.op_type === 'Loading')
      .reduce((sum, point) => sum + Number.parseFloat(point.cargo[field] || '0'), 0),
  );
}

export function toListItem(record: AuctionRecord): AuctionListItemDto {
  const { detail, list } = record;
  const loadPoints = detail.routes.filter((point) => point.op_type === 'Loading');
  const unloadPoints = detail.routes.filter((point) => point.op_type === 'Unloading');
  const load = loadPoints[0] ?? detail.routes[0];
  const unload = unloadPoints.at(-1) ?? detail.routes.at(-1);
  const price = detail.trading.price;
  const hideAddress = detail.trading.hide_points_address_and_contacts;

  return {
    main: {
      id: detail.main.id,
      cargo_num: detail.main.cargo_num,
      cargo_date: detail.main.cargo_date,
      auc_type: detail.main.auc_type,
      order_uid: detail.main.order_uid,
      created_at: detail.main.created_at,
      priority_sort: list.prioritySort,
      is_assembly: list.isAssembly,
      price_per_km: list.hasPriceBlock ? price.price_per_km : null,
    },
    organizer: {
      subscriber_id: detail.organizer.subscriber_id,
      organization_id: detail.organizer.organization_id,
      organization_name: detail.organizer.organization_name,
      organization_inn: detail.organizer.organization_inn,
      organization_kpp: detail.organizer.organization_kpp,
      is_hide_organization: list.isHideOrganization,
    },
    route: {
      load: {
        city: load?.location.city_name ?? '',
        address: hideAddress ? '' : (load?.location.loading_address ?? ''),
        date: load?.start_date ?? detail.trading.start_time,
        city_gc_id: load?.location.city_gc_id ?? 0,
        points_count: loadPoints.length,
      },
      unload: {
        city: unload?.location.city_name ?? '',
        address: hideAddress ? '' : (unload?.location.loading_address ?? ''),
        date: unload?.start_date ?? detail.trading.stop_time,
        city_gc_id: unload?.location.city_gc_id ?? 0,
        points_count: unloadPoints.length,
      },
    },
    cargo: {
      name: loadPoints[0]?.cargo.name ?? detail.routes[0]?.cargo.name ?? '',
      weight: sumRouteCargo(record, 'weight'),
      volume: sumRouteCargo(record, 'volume'),
      body_type: detail.cargo.body_type,
      truck_count: detail.cargo.truck_count,
      is_cargo: true,
      is_international: detail.cargo.is_international,
      containered: detail.cargo.containered,
      incoterms: null,
      conics: detail.cargo.conics,
      belts: detail.cargo.belts,
      adr: detail.cargo.adr,
      coupling: detail.cargo.coupling,
      air_pass: detail.cargo.air_pass,
      low_loader: detail.cargo.low_loader,
      additional_load: detail.cargo.additional_load,
      temp_from: detail.cargo.temp_from == null ? null : Math.round(detail.cargo.temp_from),
      temp_to: detail.cargo.temp_to == null ? null : Math.round(detail.cargo.temp_to),
      loading_types: detail.cargo.loading_types,
      docs: detail.cargo.docs,
      car: detail.cargo.car ?? null,
    },
    trading: {
      status: detail.trading.status,
      status_mobile: toListTradingStatus(detail.trading.status_mobile),
      start_time: detail.trading.start_time,
      stop_time: detail.trading.stop_time,
      bid_measurement_type: detail.trading.bid_measurement_type,
      can_set_bet: detail.trading.can_set_bet,
      allow_counter_bets: detail.trading.allow_counter_bets,
      hide_points_address_and_contacts: hideAddress,
      direction: list.direction,
      comment: list.comment,
      is_bidder: detail.trading.is_bidder,
      is_available: list.isAvailable,
      is_accredited: list.isAccredited,
      is_favorite: detail.trading.is_favorite,
      price:
        list.hasPriceBlock && price.start != null && price.current != null
          ? {
              start: price.start,
              current: price.current,
              current_no_vat: price.current_no_vat ?? withoutVat(price.current),
            }
          : null,
      your: list.hasYourBlock
        ? {
            bet: detail.trading.your.bet,
            // В списке доступно одно поле: показываем цену с НДС — как в примере схемы.
            last_bet: detail.trading.your.last_bet_with_vat ?? detail.trading.your.last_bet ?? null,
          }
        : null,
      red_bet_with_vat: detail.trading.red_bet_with_vat,
      red_bet_no_vat: detail.trading.red_bet_no_vat,
      is_last_bet_with_vat: detail.trading.is_last_bet_with_vat,
    },
    payment: {
      form: detail.payment.form,
      currency_code: detail.payment.currency_code,
      consignor: list.consignor,
      consignee: list.consignee,
    },
  };
}
