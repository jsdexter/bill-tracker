import { useState } from 'react';
import { useBills } from '../context/BillsContext';
import BillForm from '../components/BillForm';
import { ordinalDay } from '../utils/dates';
import type { Bill } from '../types';

export default function BillsScreen() {
  const { bills, addBill, updateBill, deleteBill } = useBills();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);

  const sorted = [...bills].sort((a, b) => a.dueDayOfMonth - b.dueDayOfMonth);
  const monthlyTotal = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Bills</div>
        <button onClick={() => setAdding(true)} style={{
          background: '#7c6af5', border: 'none', borderRadius: 20,
          padding: '6px 14px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
        }}>+ Add Bill</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(bill => (
          <div key={bill.id} onClick={() => setEditing(bill)} style={{
            background: '#1a1a2e', borderRadius: 8, padding: '10px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontWeight: 600 }}>{bill.name}</div>
              <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
                Due {ordinalDay(bill.dueDayOfMonth)} · {bill.account} · monthly
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>${bill.amount.toLocaleString()}</div>
              <div style={{ color: '#555', fontSize: 11 }}>edit ›</div>
            </div>
          </div>
        ))}
        {bills.length === 0 && (
          <div style={{ color: '#555', fontSize: 13, textAlign: 'center', padding: 32 }}>
            No bills yet — tap "+ Add Bill" to get started
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12 }}>
        <div>{bills.length} bill{bills.length !== 1 ? 's' : ''}</div>
        <div style={{ color: '#f87171' }}>${monthlyTotal.toLocaleString()} / month</div>
      </div>

      {adding && (
        <BillForm
          onSave={async draft => {
            await addBill({ ...draft, frequency: 'monthly', active: true });
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <BillForm
          initial={editing}
          onSave={async draft => {
            await updateBill(editing.id, draft);
            setEditing(null);
          }}
          onDelete={async () => {
            await deleteBill(editing.id);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
