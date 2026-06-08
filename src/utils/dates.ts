import type { Income } from '../types';

export function getWeekRange(date: Date): { start: Date; end: Date } {
  // Use UTC methods to avoid timezone shifts when dates are parsed from ISO strings
  const day = date.getUTCDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + diffToMon);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

export function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatMonth(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function ordinalDay(day: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function formatShortDate(date: Date): string {
  // Use UTC to avoid timezone-shift issues when date was parsed from an ISO string
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function getPaydaysInMonth(income: Income, year: number, month: number): Date[] {
  const anchor = new Date(income.firstPaydayAnchor + 'T00:00:00');
  const result: Date[] = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0); // last day of month

  if (income.frequency === 'monthly') {
    const clampedDay = Math.min(anchor.getDate(), monthEnd.getDate());
    const d = new Date(year, month - 1, clampedDay);
    result.push(d);
    return result;
  }

  if (income.frequency === 'twice-monthly') {
    const day1 = Math.min(anchor.getDate(), monthEnd.getDate());
    const day2 = Math.min(day1 + 15, monthEnd.getDate());
    const d1 = new Date(year, month - 1, day1);
    const d2 = new Date(year, month - 1, day2);
    if (d1 >= monthStart && d1 <= monthEnd) result.push(d1);
    if (d2 >= monthStart && d2 <= monthEnd && d2.getTime() !== d1.getTime()) result.push(d2);
    return result.sort((a, b) => a.getTime() - b.getTime());
  }

  const intervalDays = income.frequency === 'weekly' ? 7 : 14;

  // Walk backward from anchor to find first occurrence on or after monthStart
  let cursor = new Date(anchor);
  cursor.setHours(0, 0, 0, 0);

  // Step cursor to the earliest payday >= monthStart
  while (cursor < monthStart) cursor.setDate(cursor.getDate() + intervalDays);
  // Step back in case we overshot
  while (cursor > monthStart) {
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - intervalDays);
    if (prev < monthStart) break;
    cursor = prev;
  }

  while (cursor <= monthEnd) {
    if (cursor >= monthStart) result.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + intervalDays);
  }

  return result;
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isInWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d >= weekStart && d <= weekEnd;
}
