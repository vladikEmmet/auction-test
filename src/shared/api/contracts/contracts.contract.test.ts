import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import {
  admittedOrganizationSchema,
  assemblySchema,
  auctionListItemCargoCarSchema,
  auctionListItemCargoSchema,
  auctionListItemMainSchema,
  auctionListItemOrganizerSchema,
  auctionListItemPaymentSchema,
  auctionListItemRoutePointSchema,
  auctionListItemRouteSchema,
  auctionListItemSchema,
  auctionListItemTradingPriceSchema,
  auctionListItemTradingSchema,
  auctionListItemTradingYourSchema,
  auctionListMetaSchema,
  auctionListRequestSchema,
  auctionListResponseSchema,
  auctionShowCargoSchema,
  auctionShowMainSchema,
  auctionShowOrganizerSchema,
  auctionShowPaymentSchema,
  auctionShowResponseSchema,
  auctionShowTradingPriceSchema,
  auctionShowTradingSchema,
  auctionShowTradingSettingsSchema,
  auctionShowTradingYourSchema,
  betItemPriceInfoSchema,
  betItemSchema,
  betListResponseSchema,
  carRequirementsSchema,
  contactSchema,
  docsSchema,
  loadingTypesSchema,
  problemDetailSchema,
  routePointCargoSchema,
  routePointContactSchema,
  routePointLocationSchema,
  routePointSchema,
  setBetRequestSchema,
  validationErrorSchema,
  validationProblemSchema,
} from '@/shared/api/contracts';
import {
  AUCTION_STATUSES,
  AUCTION_TYPES,
  BID_MEASUREMENT_TYPES,
  FILTER_AUCTION_TYPES,
  LIST_TRADING_STATUSES,
  OPERATION_TYPES,
  PAYMENT_DELAY_TYPES,
  TRADING_STATUSES,
} from '@/shared/api/contracts/enums';

type OpenApiProperty = {
  type?: string;
  nullable?: boolean;
  example?: unknown;
  enum?: string[];
  items?: OpenApiProperty;
  $ref?: string;
  oneOf?: OpenApiProperty[];
};

type OpenApiSchema = {
  type?: string;
  enum?: string[];
  nullable?: boolean;
  properties?: Record<string, OpenApiProperty>;
};

const openapi = JSON.parse(
  readFileSync(resolve(process.cwd(), 'openapi/openapi.auctions.v0.json'), 'utf8'),
) as { components: { schemas: Record<string, OpenApiSchema> } };

const schemas = openapi.components.schemas;

const OBJECT_CONTRACTS: Array<[string, z.ZodObject]> = [
  ['AuctionListRequest', auctionListRequestSchema],
  ['AuctionListResponseBase', auctionListResponseSchema],
  ['AuctionListMeta', auctionListMetaSchema],
  ['AuctionListItem', auctionListItemSchema],
  ['AuctionListItemMain', auctionListItemMainSchema],
  ['AuctionListItemRoute', auctionListItemRouteSchema],
  ['AuctionListItemRoutePoint', auctionListItemRoutePointSchema],
  ['AuctionListItemCargo', auctionListItemCargoSchema],
  ['AuctionListItemCargoCar', auctionListItemCargoCarSchema],
  ['AuctionListItemCargoDocs', docsSchema],
  ['AuctionListItemCargoLoadingType', loadingTypesSchema],
  ['AuctionListItemOrganizer', auctionListItemOrganizerSchema],
  ['AuctionListItemPayment', auctionListItemPaymentSchema],
  ['AuctionListItemTrading', auctionListItemTradingSchema],
  ['AuctionListItemTradingPrice', auctionListItemTradingPriceSchema],
  ['AuctionListItemTradingYour', auctionListItemTradingYourSchema],
  ['AuctionShowResponse', auctionShowResponseSchema],
  ['AuctionShowMain', auctionShowMainSchema],
  ['AuctionShowOrganizer', auctionShowOrganizerSchema],
  ['AuctionShowCargo', auctionShowCargoSchema],
  ['AuctionShowPayment', auctionShowPaymentSchema],
  ['AuctionShowTrading', auctionShowTradingSchema],
  ['AuctionShowTradingPrice', auctionShowTradingPriceSchema],
  ['AuctionShowTradingYour', auctionShowTradingYourSchema],
  ['AuctionShowTradingSettings', auctionShowTradingSettingsSchema],
  ['Assembly', assemblySchema],
  ['RoutePoint', routePointSchema],
  ['RoutePointLocation', routePointLocationSchema],
  ['RoutePointCargo', routePointCargoSchema],
  ['RoutePointContact', routePointContactSchema],
  ['Contact', contactSchema],
  ['CarRequirements', carRequirementsSchema],
  ['Docs', docsSchema],
  ['LoadingTypes', loadingTypesSchema],
  ['AdmittedOrganization', admittedOrganizationSchema],
  ['BetListResponse', betListResponseSchema],
  ['BetItem', betItemSchema],
  ['BetItemPriceInfo', betItemPriceInfoSchema],
  ['SetBetRequest', setBetRequestSchema],
  ['ProblemDetail', problemDetailSchema],
  ['ValidationError', validationErrorSchema],
  ['ValidationProblem', validationProblemSchema],
];

const ENUM_CONTRACTS: Array<[string, readonly string[]]> = [
  ['AuctionType', AUCTION_TYPES],
  ['AuctionStatus', AUCTION_STATUSES],
  ['TradingStatus', TRADING_STATUSES],
  ['BidMeasurementType', BID_MEASUREMENT_TYPES],
  ['OperationType', OPERATION_TYPES],
  ['PaymentDelayType', PAYMENT_DELAY_TYPES],
];

function isNullableInSchema(property: OpenApiProperty): boolean {
  return property.nullable === true || property.example === null;
}

describe('контракт enum-значений', () => {
  it.each(ENUM_CONTRACTS)('%s содержит те же значения, что и схема', (name, values) => {
    expect(schemas[name]?.enum).toBeDefined();
    expect([...values].sort()).toEqual([...(schemas[name]?.enum ?? [])].sort());
  });

  it('status_mobile в списке использует сокращённый набор статусов', () => {
    const listStatusMobile = schemas.AuctionListItemTrading?.properties?.status_mobile;
    expect([...LIST_TRADING_STATUSES].sort()).toEqual([...(listStatusMobile?.enum ?? [])].sort());
  });

  it('фильтр auc_type не принимает Unknown', () => {
    const filterAucType = schemas.AuctionListRequest?.properties?.auc_type;
    expect([...FILTER_AUCTION_TYPES].sort()).toEqual(
      [...(filterAucType?.items?.enum ?? [])].sort(),
    );
  });

  it('фильтр status использует полный набор торговых статусов', () => {
    const filterStatus = schemas.AuctionListRequest?.properties?.status;
    expect([...TRADING_STATUSES].sort()).toEqual([...(filterStatus?.items?.enum ?? [])].sort());
  });
});

describe('контракт полей DTO', () => {
  it.each(OBJECT_CONTRACTS)('%s: набор полей совпадает со схемой', (name, schema) => {
    const specKeys = Object.keys(schemas[name]?.properties ?? {}).sort();
    const codeKeys = Object.keys(schema.shape).sort();
    expect(codeKeys).toEqual(specKeys);
  });

  it.each(OBJECT_CONTRACTS)('%s: nullable-поля допускают null', (name, schema) => {
    const properties = schemas[name]?.properties ?? {};

    for (const [key, property] of Object.entries(properties)) {
      if (!isNullableInSchema(property)) continue;

      const field = schema.shape[key];
      expect(field, `${name}.${key} отсутствует в Zod-схеме`).toBeDefined();
      expect(
        field?.safeParse(null).success,
        `${name}.${key} объявлено nullable в схеме, но Zod не принимает null`,
      ).toBe(true);
    }
  });
});

describe('контракт эндпоинтов', () => {
  const paths = (openapi as unknown as { paths: Record<string, Record<string, unknown>> }).paths;

  it('используются ровно те пути, что описаны в схеме', () => {
    expect(Object.keys(paths).sort()).toEqual(
      ['/auctions/list', '/auctions/{auctionUuid}', '/auctions/{auctionUuid}/bets'].sort(),
    );
  });

  it('ставка ставится методом POST, список ставок — GET', () => {
    expect(Object.keys(paths['/auctions/{auctionUuid}/bets'] ?? {}).sort()).toEqual([
      'get',
      'post',
    ]);
    expect(Object.keys(paths['/auctions/list'] ?? {})).toEqual(['post']);
  });
});
