import { useState } from 'react';
import type { Bill } from '../types';

type BillDraft = Omit<Bill, 'id' | 'createdAt' | 'active' | 'frequency'>;

interface BillFormProps {
  initial?: BillDraft & { id?: string };
  onSave: (draft: BillDraft) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export default function BillForm({ initial, onSave, onDelete, onCancel }: BillFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [day, setDay] = useState(String(initial?.dueDayOfMonth ?? ''));
  const [account, setAccount] = useState(initial?.account ?? '');

  const valid = name.trim() && Number(amount) > 0 && Number(day) >= 1 && Number(day) <= 31;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1a1a2e', border: '1px solid #2a2a4a',
    borderRadius: 8, padding: '10px 12px', color: '#e0e0e0', fontSize: 14,
    outline: 'none', marginBottom: 12,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', zIndex: 100,
    }} onClick={onCancel}>
      <div style={{
        background: '#0f0f1a', borderRadius: '16px 16px 0 0', padding: 20,
        width: '100%', maxWidth: 480, margin: '0 auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          {initial?.id ? 'Edit Bill' : 'Add Bill'}
        </div>

        <input style={inputStyle} placeholder="Name (e.g. 🏠 Rent)" value={name} onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={inputStyle} placeholder="Due day (1–31)" type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)} />
        <input style={inputStyle} placeholder="Account (e.g. Chase)" value={account} onChange={e => setAccount(e.target.value)} />

        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button onClick={onDelete} style={{
              flex: 1, padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#2e1a1a', color: '#f87171', fontWeight: 600,
            }}>Delete</button>
          )}
          <button onClick={onCancel} style={{
            flex: 1, padding: 12, borderRadius: 8, border: '1px solid #2a2a4a',
            cursor: 'pointer', background: 'none', color: '#888',
          }}>Cancel</button>
          <button
            disabled={!valid}
            onClick={() => onSave({ name: name.trim(), amount: Number(amount), dueDayOfMonth: Number(day), account: account.trim() })}
            style={{
              flex: 2, padding: 12, borderRadius: 8, border: 'none', cursor: valid ? 'pointer' : 'default',
              background: valid ? '#7c6af5' : '#2a2a4a', color: '#fff', fontWeight: 700,
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
