import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, ensureSignedIn } from '../firebase';
import type { Bill, Payment } from '../types';

interface BillsContextValue {
  uid: string | null;
  bills: Bill[];
  payments: Payment[];
  addBill: (b: Omit<Bill, 'id' | 'createdAt'>) => Promise<void>;
  updateBill: (id: string, changes: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  togglePaid: (paymentId: string, paid: boolean) => Promise<void>;
  loading: boolean;
}

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const billsCol = (u: string) => collection(db, 'users', u, 'bills');
  const paymentsCol = (u: string) => collection(db, 'users', u, 'payments');

  const loadData = useCallback(async (u: string) => {
    const [billSnap, paySnap] = await Promise.all([
      getDocs(billsCol(u)),
      getDocs(paymentsCol(u)),
    ]);
    const loadedBills = billSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bill));
    const loadedPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
    setBills(loadedBills.filter(b => b.active));
    setPayments(loadedPayments);
    return { bills: loadedBills.filter(b => b.active), payments: loadedPayments };
  }, []);

  const ensurePayments = useCallback(async (
    u: string, activeBills: Bill[], existingPayments: Payment[]
  ) => {
    const now = new Date();
    const months = [
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      `${now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()}-${String((now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2)).padStart(2, '0')}`,
    ];

    const batch = writeBatch(db);
    let created = false;

    for (const month of months) {
      for (const bill of activeBills) {
        const exists = existingPayments.some(p => p.billId === bill.id && p.month === month);
        if (!exists) {
          const ref = doc(paymentsCol(u));
          batch.set(ref, {
            billId: bill.id,
            month,
            amount: bill.amount,
            paid: false,
            paidAt: null,
            createdAt: Date.now(),
          });
          created = true;
        }
      }
    }

    if (created) {
      await batch.commit();
      const paySnap = await getDocs(paymentsCol(u));
      setPayments(paySnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    }
  }, []);

  useEffect(() => {
    ensureSignedIn().then(async u => {
      setUid(u);
      const { bills: b, payments: p } = await loadData(u);
      await ensurePayments(u, b, p);
      setLoading(false);
    });
  }, [loadData, ensurePayments]);

  const addBill = useCallback(async (b: Omit<Bill, 'id' | 'createdAt'>) => {
    if (!uid) return;
    const ref = await addDoc(billsCol(uid), { ...b, createdAt: Date.now() });
    const newBill: Bill = { ...b, id: ref.id, createdAt: Date.now() };
    setBills(prev => [...prev, newBill]);
    await ensurePayments(uid, [...bills, newBill], payments);
  }, [uid, bills, payments, ensurePayments]);

  const updateBill = useCallback(async (id: string, changes: Partial<Bill>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'bills', id), changes as Record<string, unknown>);
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  }, [uid]);

  const deleteBill = useCallback(async (id: string) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'bills', id), { active: false });
    setBills(prev => prev.filter(b => b.id !== id));
  }, [uid]);

  const togglePaid = useCallback(async (paymentId: string, paid: boolean) => {
    if (!uid) return;
    const changes = { paid, paidAt: paid ? Date.now() : null };
    await updateDoc(doc(db, 'users', uid, 'payments', paymentId), changes);
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, ...changes } : p));
  }, [uid]);

  return (
    <BillsContext.Provider value={{ uid, bills, payments, addBill, updateBill, deleteBill, togglePaid, loading }}>
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error('useBills must be used within BillsProvider');
  return ctx;
}
