const BREACH_NOTIFICATION_HOURS = 72;

export function calculateBreachDeadline(detectedAt: Date): Date {
  return new Date(detectedAt.getTime() + BREACH_NOTIFICATION_HOURS * 60 * 60 * 1000);
}

export function isBreachOverdue(deadline: Date, now: Date = new Date()): boolean {
  return now > deadline;
}

export function getBreachHoursRemaining(deadline: Date, now: Date = new Date()): number {
  return (deadline.getTime() - now.getTime()) / (60 * 60 * 1000);
}
