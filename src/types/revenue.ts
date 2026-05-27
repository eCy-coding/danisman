export type Currency = 'USD' | 'TRY' | 'EUR';
export type RetainerStatus = 'ACTIVE' | 'PAUSED' | 'TERMINATED';
export type MilestoneStatus = 'PENDING' | 'INVOICED' | 'PAID' | 'DELAYED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type ProspectStatus = 'SENT' | 'OPENED' | 'REPLIED' | 'MEETING' | 'DISQUALIFIED';
export type WaveStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED';

export interface MilestoneRow {
  id: string;
  name: string;
  pct: number;
  status: MilestoneStatus;
}

export interface RetainerRow {
  id: string;
  dealName: string;
  currency: Currency;
  monthlyAmount: number;
  status: RetainerStatus;
  daysOverdue?: number;
}

export interface ProspectRow {
  id: string;
  companyName: string;
  contactName?: string;
  status: ProspectStatus;
  estimatedValueUsd?: number;
}

export interface WaveRow {
  id: string;
  name: string;
  status: WaveStatus;
  prospects: ProspectRow[];
  targetRevenueUsd?: number;
  realizedRevenueUsd: number;
}
