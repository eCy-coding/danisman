const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SLA_DAYS = 30;
const SLA_EXTENSION_DAYS = 30;

export function calculateSLA(receivedAt: Date, extended: boolean): Date {
  const base = new Date(receivedAt.getTime() + SLA_DAYS * MS_PER_DAY);
  if (extended) return new Date(base.getTime() + SLA_EXTENSION_DAYS * MS_PER_DAY);
  return base;
}

export type SLABadge = 'green' | 'yellow' | 'red' | 'overdue';

export function getSLABadge(deadline: Date, now: Date = new Date()): SLABadge {
  const msRemaining = deadline.getTime() - now.getTime();
  if (msRemaining < 0) return 'overdue';
  const daysRemaining = msRemaining / MS_PER_DAY;
  if (daysRemaining <= 1) return 'red';
  if (daysRemaining <= 7) return 'yellow';
  return 'green';
}

export function canExtend(extendedOnce: boolean): boolean {
  return !extendedOnce;
}
