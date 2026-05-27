export interface InvoiceInput {
  subtotal: number;
  kdvRate: number; // e.g. 0.20
  stopajRate: number; // e.g. 0 or 0.20
}

export interface InvoiceResult {
  subtotal: number;
  kdv: number;
  stopaj: number;
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateInvoice(input: InvoiceInput): InvoiceResult {
  // Geçersiz finansal değerler (NaN, Infinity) sessizce yanlış sonuç üretmemeli
  if (!isFinite(input.subtotal) || !isFinite(input.kdvRate) || !isFinite(input.stopajRate)) {
    throw new Error('Geçersiz finansal değer');
  }
  const kdv = round2(input.subtotal * input.kdvRate);
  const stopaj = round2(input.subtotal * input.stopajRate);
  const total = round2(input.subtotal + kdv - stopaj);
  return { subtotal: input.subtotal, kdv, stopaj, total };
}

export interface LateInterestInput {
  invoiceTotal: number;
  daysLate: number;
  tcmbAnnualRate: number; // e.g. 0.35 for 35%
}

// TBK m.118: aylık TCMB avans faizi + %4 ek sözleşmesel ceza
// Annual rate → monthly → daily → multiply by days
export function calculateLateInterest(input: LateInterestInput): number {
  const annualRate = input.tcmbAnnualRate + 0.04;
  const dailyRate = annualRate / 12 / 30;
  return round2(input.invoiceTotal * dailyRate * input.daysLate);
}

// M&A success fee: %1-3 of transaction value, paid at closing
export function calculateSuccessFee(transactionValue: number, feePct: number): number {
  if (feePct < 0.01 || feePct > 0.03) {
    throw new Error('Success fee %1-3 dışında');
  }
  return round2(transactionValue * feePct);
}

// Milestone amount from total deal fee: e.g. Avans %30 → 0.30 * totalFee
export function calculateMilestoneAmount(totalFee: number, pct: number): number {
  return round2(totalFee * pct);
}

// TCMB late interest rate — hardcoded table fallback (2026 typical range)
// Production: replace with live API fetch + 24h Redis cache
const TCMB_RATE_TABLE: Record<string, number> = {
  '2026': 0.35,
};

export async function getTCMBLateInterestRate(asOfDate: Date): Promise<number> {
  const year = String(asOfDate.getFullYear());
  return TCMB_RATE_TABLE[year] ?? 0.35;
}
