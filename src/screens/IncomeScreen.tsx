import { useState } from 'react';
import { useIncome } from '../context/IncomeContext';
import IncomeForm from '../components/IncomeForm';
import { getPaydaysInMonth, formatShortDate } from '../utils/dates';
import type { Income } from '../types';

const FREQ_LABEL: Record<string, string> = {
  weekly: 'weekly', biweekly: 'biweekly', 'twice-monthly': 'twice/month', monthly: 'monthly',
};

function monthlyEquivalent(i: Income): number {
  const f = i.frequency;
  if (f === 'weekly') return i.amount * 52 / 12;
  if (f === 'biweekly') return i.amount * 26 / 12;
  if (f === 'twice-monthly') return i.amount * 2;
  return i.amount;
}

export default function IncomeScreen() {
  const { incomes, addIncome, updateIncome, deleteIncome } = useIncome();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);

  const now = new Date();
  const monthlyTotal = incomes.reduce((s, i) => s + monthlyEquivalent(i), 0);

  function nextPayday(income: Income): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Check this month and next month
    for (let offset = 0; offset <= 1; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const days = getPaydaysInMonth(income, d.getFullYear(), d.getMonth() + 1);
      const future = days.find(day => { const dd = new Date(day); dd.setHours(0,0,0,0); return dd >= today; });
      if (future) return formatShortDate(future);
    }
    return '—';
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Income</div>
        <button onClick={() => setAdding(true)} style={{
          background: '#4ade80', border: 'none', borderRadius: 20,
          padding: '6px 14px', color: '#0f0f1a', fontWeight: 700, cursor: 'pointer', fontSize: 13,
        }}>+ Add Income</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {incomes.map(income => (
          <div key={income.id} onClick={() => setEditing(income)} style={{
            background: '#0a1f0a', border: '1px solid #4ade8030', borderRadius: 8,
            padding: '10px 12px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', cursor: 'pointer',
          }}>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 600 }}>💰 {income.name}</div>
              <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                {income.account} · {FREQ_LABEL[income.frequency]}
              </div>
              <div style={{ color: '#555', fontSize: 11 }}>Next: {nextPayday(income)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#4ade80', fontWeight: 600 }}>+${income.amount.toLocaleString()}</div>
              <div style={{ color: '#555', fontSize: 11 }}>edit ›</div>
            </div>
          </div>
        ))}
        {incomes.length === 0 && (
          <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 32 }}>
            No income sources yet — tap "+ Add Income" to get started
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12 }}>
        <div>{incomes.length} source{incomes.length !== 1 ? 's' : ''}</div>
        <div style={{ color: '#4ade80' }}>~${Math.round(monthlyTotal).toLocaleString()} / month</div>
      </div>

      {adding && (
        <IncomeForm
          onSave={async draft => {
            await addIncome({ ...draft, active: true });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <IncomeForm
          key={editing.id}
          initial={editing}
          onSave={async draft => {
            await updateIncome(editing.id, draft);
            setEditing(null);
          }}
          onDelete={async () => {
            await deleteIncome(editing.id);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
