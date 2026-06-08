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

// Fix 1: Helper outside component — uses Date constructor for safe month rollover
function monthStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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

  // Fix 1 + Fix 2: Use Date constructor for month rollover; fetch fresh payments from Firestore
  const ensurePayments = useCallback(async (u: string, activeBills: Bill[]) => {
    const now = new Date();
    const months = [
      monthStr(now),
      monthStr(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
    ];

    const paySnap = await getDocs(paymentsCol(u));
    const existingPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));

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
    }

    // Always refresh payments state from Firestore after this call
    const freshSnap = await getDocs(paymentsCol(u));
    setPayments(freshSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
  }, []);

  // Fix 3: Add error handling so loading is always cleared
  useEffect(() => {
    ensureSignedIn().then(async u => {
      try {
        setUid(u);
        const { bills: b } = await loadData(u);
        await ensurePayments(u, b);
      } finally {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [loadData, ensurePayments]);

  // Fix 4: Capture createdAt once; drop payments from dependency array
  const addBill = useCallback(async (b: Omit<Bill, 'id' | 'createdAt'>) => {
    if (!uid) return;
    const createdAt = Date.now();
    const ref = await addDoc(billsCol(uid), { ...b, createdAt });
    const newBill: Bill = { ...b, id: ref.id, createdAt };
    setBills(prev => [...prev, newBill]);
    await ensurePayments(uid, [...bills, newBill]);
  }, [uid, bills, ensurePayments]);

  const updateBill = useCallback(async (id: string, changes: Partial<Bill>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'bills', id), changes as Record<string, unknown>);
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  }, [uid]);

  // Fix 5: Filter orphaned payments from local state when a bill is deleted
  const deleteBill = useCallback(async (id: string) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'bills', id), { active: false });
    setBills(prev => prev.filter(b => b.id !== id));
    setPayments(prev => prev.filter(p => p.billId !== id));
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
