import { describe, it, expect } from 'vitest';
import {
  getWeekRange,
  getDaysUntil,
  formatMonth,
  ordinalDay,
  getPaydaysInMonth,
  formatShortDate,
} from './dates';
import type { Income } from '../types';

describe('getWeekRange', () => {
  it('returns Monday as start for a Wednesday', () => {
    const wed = new Date('2026-06-10'); // Wednesday
    const { start, end } = getWeekRange(wed);
    expect(start.toISOString().slice(0, 10)).toBe('2026-06-08'); // Monday
    expect(end.toISOString().slice(0, 10)).toBe('2026-06-14');   // Sunday
  });

  it('returns same day as both start and end for Monday', () => {
    const mon = new Date('2026-06-08');
    const { start, end } = getWeekRange(mon);
    expect(start.toISOString().slice(0, 10)).toBe('2026-06-08');
    expect(end.toISOString().slice(0, 10)).toBe('2026-06-14');
  });
});

describe('getDaysUntil', () => {
  it('returns 0 for today', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(getDaysUntil(today)).toBe(0);
  });

  it('returns positive for future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDaysUntil(future)).toBe(5);
  });
});

describe('formatMonth', () => {
  it('formats year and month', () => {
    expect(formatMonth(2026, 6)).toBe('June 2026');
    expect(formatMonth(2026, 1)).toBe('January 2026');
  });
});

describe('ordinalDay', () => {
  it('adds correct suffix', () => {
    expect(ordinalDay(1)).toBe('1st');
    expect(ordinalDay(2)).toBe('2nd');
    expect(ordinalDay(3)).toBe('3rd');
    expect(ordinalDay(4)).toBe('4th');
    expect(ordinalDay(11)).toBe('11th');
    expect(ordinalDay(21)).toBe('21st');
    expect(ordinalDay(22)).toBe('22nd');
  });
});

describe('getPaydaysInMonth', () => {
  const base: Omit<Income, 'frequency' | 'firstPaydayAnchor'> = {
    id: '1', name: 'Test', amount: 1000, account: 'Chase',
    receivedDates: [], active: true, createdAt: 0,
  };

  it('biweekly: returns correct paydays in month', () => {
    // anchor Jun 2 → paydays Jun 2, Jun 16, Jun 30
    const income: Income = { ...base, frequency: 'biweekly', firstPaydayAnchor: '2026-06-02' };
    const days = getPaydaysInMonth(income, 2026, 6).map(d => d.toISOString().slice(0, 10));
    expect(days).toEqual(['2026-06-02', '2026-06-16', '2026-06-30']);
  });

  it('monthly: returns one payday matching anchor day', () => {
    const income: Income = { ...base, frequency: 'monthly', firstPaydayAnchor: '2026-05-15' };
    const days = getPaydaysInMonth(income, 2026, 6).map(d => d.toISOString().slice(0, 10));
    expect(days).toEqual(['2026-06-15']);
  });

  it('twice-monthly: returns anchor day and anchor day + 15', () => {
    // anchor Jun 1 → Jun 1, Jun 16
    const income: Income = { ...base, frequency: 'twice-monthly', firstPaydayAnchor: '2026-06-01' };
    const days = getPaydaysInMonth(income, 2026, 6).map(d => d.toISOString().slice(0, 10));
    expect(days).toEqual(['2026-06-01', '2026-06-16']);
  });

  it('weekly: returns all matching weekdays in month', () => {
    // anchor Jun 2 (Tuesday) → Jun 2, 9, 16, 23, 30
    const income: Income = { ...base, frequency: 'weekly', firstPaydayAnchor: '2026-06-02' };
    const days = getPaydaysInMonth(income, 2026, 6).map(d => d.toISOString().slice(0, 10));
    expect(days).toEqual(['2026-06-02', '2026-06-09', '2026-06-16', '2026-06-23', '2026-06-30']);
  });
});

describe('formatShortDate', () => {
  it('formats date as "Jun 2"', () => {
    expect(formatShortDate(new Date('2026-06-02'))).toBe('Jun 2');
  });
});
