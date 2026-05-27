export type DealType = 'SELL_SIDE' | 'BUY_SIDE' | 'DD_ONLY' | 'PMI' | 'ADVISORY' | 'OTHER';

export type DealStage =
  | 'DISCOVERY'
  | 'DD'
  | 'NEGOTIATION'
  | 'SPA_SIGNING'
  | 'CLOSING'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  DISCOVERY: 'Keşif',
  DD: 'Durum Tespiti',
  NEGOTIATION: 'Müzakere',
  SPA_SIGNING: 'SPA İmzası',
  CLOSING: 'Kapanış',
  CLOSED_WON: 'Kazanıldı',
  CLOSED_LOST: 'Kaybedildi',
};

export const DEAL_STAGES: DealStage[] = [
  'DISCOVERY',
  'DD',
  'NEGOTIATION',
  'SPA_SIGNING',
  'CLOSING',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export interface DealRow {
  id: string;
  name: string;
  type: DealType;
  stage: DealStage;
  transactionValueUsd?: number;
  successFeePct: number;
  successFeeUsd?: number;
  expectedCloseDate?: string;
  ownerId: string;
  closedLostReason?: string;
}
