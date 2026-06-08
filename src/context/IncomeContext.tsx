import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Income } from '../types';
import { isoDate } from '../utils/dates';

interface IncomeContextValue {
  incomes: Income[];
  addIncome: (i: Omit<Income, 'id' | 'createdAt' | 'receivedDates'>) => Promise<void>;
  updateIncome: (id: string, changes: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  toggleReceived: (incomeId: string, date: Date) => Promise<void>;
  isReceived: (incomeId: string, date: Date) => boolean;
}

const IncomeContext = createContext<IncomeContextValue | null>(null);

export function IncomeProvider({ uid, children }: { uid: string | null; children: ReactNode }) {
  const [incomes, setIncomes] = useState<Income[]>([]);

  const col = (u: string) => collection(db, 'users', u, 'income');

  useEffect(() => {
    if (!uid) return;
    getDocs(col(uid)).then(snap => {
      setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Income)).filter(i => i.active));
    });
  }, [uid]);

  const addIncome = useCallback(async (i: Omit<Income, 'id' | 'createdAt' | 'receivedDates'>) => {
    if (!uid) return;
    const createdAt = Date.now();
    const ref = await addDoc(col(uid), { ...i, receivedDates: [], createdAt });
    setIncomes(prev => [...prev, { ...i, id: ref.id, receivedDates: [], createdAt }]);
  }, [uid]);

  const updateIncome = useCallback(async (id: string, changes: Partial<Income>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'income', id), changes as Record<string, unknown>);
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i));
  }, [uid]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'income', id), { active: false });
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, [uid]);

  const toggleReceived = useCallback(async (incomeId: string, date: Date) => {
    if (!uid) return;
    const iso = isoDate(date);
    const income = incomes.find(i => i.id === incomeId);
    if (!income) return;
    const already = income.receivedDates.includes(iso);
    const next = already
      ? income.receivedDates.filter(d => d !== iso)
      : [...income.receivedDates, iso];
    setIncomes(prev => prev.map(i => i.id === incomeId ? { ...i, receivedDates: next } : i));
    await updateDoc(doc(db, 'users', uid, 'income', incomeId), { receivedDates: next });
  }, [uid, incomes]);

  const isReceived = useCallback((incomeId: string, date: Date): boolean => {
    const income = incomes.find(i => i.id === incomeId);
    return income?.receivedDates.includes(isoDate(date)) ?? false;
  }, [incomes]);

  return (
    <IncomeContext.Provider value={{ incomes, addIncome, updateIncome, deleteIncome, toggleReceived, isReceived }}>
      {children}
    </IncomeContext.Provider>
  );
}

export function useIncome() {
  const ctx = useContext(IncomeContext);
  if (!ctx) throw new Error('useIncome must be used within IncomeProvider');
  return ctx;
}
