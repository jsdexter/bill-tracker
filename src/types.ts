export type PayFrequency = 'weekly' | 'biweekly' | 'twice-monthly' | 'monthly';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDayOfMonth: number;
  account: string;
  frequency: 'monthly';
  active: boolean;
  createdAt: number;
}

export interface Payment {
  id: string;
  billId: string;
  month: string;        // "2026-06"
  amount: number;
  paid: boolean;
  paidAt: number | null;
  createdAt: number;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  account: string;
  frequency: PayFrequency;
  firstPaydayAnchor: string; // ISO date "2026-06-02"
  receivedDates: string[];   // ISO dates marked received
  active: boolean;
  createdAt: number;
}
