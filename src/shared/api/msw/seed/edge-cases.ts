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

export const EDGE_CASES: EdgeCase[] = [
  {
    aucType: 'Down',
    status: 'Auction',
    statusMobile: 'NotParticipating',
    canSetBet: true,
    competitorBets: 3,
  },

  {
    aucType: 'Up',
    status: 'Auction',
    statusMobile: 'Leading',
    canSetBet: true,
    competitorBets: 2,
    ownBet: true,
  },

  {
    aucType: 'FixPrice',
    status: 'Auction',
    statusMobile: 'NotParticipating',
    canSetBet: true,
    competitorBets: 0,
  },

  {
    aucType: 'Request',
    status: 'Auction',
    statusMobile: 'NotParticipating',
    canSetBet: true,
    hideBetsHistory: true,
    competitorBets: 2,
  },

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

  {
    aucType: 'Down',
    status: 'Planning',
    statusMobile: 'NotParticipating',
    canSetBet: false,
    competitorBets: 0,
    noPriceBlockInList: true,
    noYourBlockInList: true,
  },

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
