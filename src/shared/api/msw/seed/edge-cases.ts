import type { AuctionStatus, AuctionType, TradingStatus } from '@/shared/api/contracts';

export type EdgeCase = {
  aucType: AuctionType;
  status: AuctionStatus;
  statusMobile: TradingStatus;
  canSetBet: boolean;
  hideBetsHistory?: boolean;
  hidePointsAndContacts?: boolean;
  noViewCargoPrice?: boolean;
  hidePlaces?: boolean;
  competitorBets?: number;
  ownBet?: boolean;
  rejectedBet?: boolean;
  winnerBet?: boolean;
  noCarRequirements?: boolean;
  noPriceBlockInList?: boolean;
  noYourBlockInList?: boolean;
  multiPoint?: boolean;
  noContacts?: boolean;
};

export /**
 * Первые записи фиксируют edge cases схемы, чтобы их можно было открыть по прямой ссылке
 * и проверить руками. Остальные генерируются PRNG для наполнения списка и пагинации.
 */
const EDGE_CASES: EdgeCase[] = [
  // 1 — обычный аукцион на понижение с историей ставок, ставок пользователя нет.
  { aucType: 'Down', status: 'Auction', statusMobile: 'NotParticipating', canSetBet: true, competitorBets: 3 },
  // 2 — пользователь лидирует, доступно изменение ставки.
  { aucType: 'Up', status: 'Auction', statusMobile: 'Leading', canSetBet: true, competitorBets: 2, ownBet: true },
  // 3 — ставок нет вообще: empty state списка ставок.
  { aucType: 'FixPrice', status: 'Auction', statusMobile: 'NotParticipating', canSetBet: true, competitorBets: 0 },
  // 4 — история ставок скрыта организатором.
  {
    aucType: 'Request',
    status: 'Auction',
    statusMobile: 'NotParticipating',
    canSetBet: true,
    hideBetsHistory: true,
    competitorBets: 2,
  },
  // 5 — контакты и адреса скрыты, цена груза скрыта, пользователь перебит, ставка запрещена.
  {
    aucType: 'Down',
    status: 'DeterminateWinner',
    statusMobile: 'Losing',
    canSetBet: false,
    hidePointsAndContacts: true,
    noViewCargoPrice: true,
    competitorBets: 3,
    ownBet: true,
    noContacts: true,
  },
  // 6 — завершённый аукцион: есть победитель и отменённая ставка с причиной.
  {
    aucType: 'Down',
    status: 'Finished',
    statusMobile: 'Winner',
    canSetBet: false,
    competitorBets: 3,
    ownBet: true,
    rejectedBet: true,
    winnerBet: true,
  },
  // 7 — торги ещё не начались: в списке нет блоков price и your.
  {
    aucType: 'Down',
    status: 'Planning',
    statusMobile: 'NotParticipating',
    canSetBet: false,
    competitorBets: 0,
    noPriceBlockInList: true,
    noYourBlockInList: true,
  },
  // 8 — неизвестные enum-значения, скрытый рейтинг, нет требований к ТС, маршрут из 4 точек.
  {
    aucType: 'Unknown',
    status: 'Unknown',
    statusMobile: 'Unknown',
    canSetBet: false,
    hidePlaces: true,
    competitorBets: 2,
    noCarRequirements: true,
    multiPoint: true,
  },
  // 9 — статус «на рассмотрении»: есть в детальном DTO, но отсутствует в списочном.
  {
    aucType: 'Request',
    status: 'WaitDeal',
    statusMobile: 'OnPending',
    canSetBet: false,
    competitorBets: 2,
    ownBet: true,
  },
];

export const AUC_TYPE_CYCLE: AuctionType[] = ['Down', 'Up', 'Request', 'FixPrice'];
export const STATUS_CYCLE: AuctionStatus[] = [
  'Auction',
  'Auction',
  'Planning',
  'InProgress',
  'Finished',
  'Stopped',
  'Canceled',
  'WaitDeal',
];

export const MOBILE_STATUS_CYCLE: TradingStatus[] = [
  'NotParticipating',
  'NotParticipating',
  'Leading',
  'Losing',
  'Confirmed',
  'Winner',
];
