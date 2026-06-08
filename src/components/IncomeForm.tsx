import { useState } from 'react';
import type { Income, PayFrequency } from '../types';

type IncomeDraft = Omit<Income, 'id' | 'createdAt' | 'receivedDates' | 'active'>;

interface IncomeFormProps {
  initial?: IncomeDraft & { id?: string };
  onSave: (draft: IncomeDraft) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'twice-monthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
];

export default function IncomeForm({ initial, onSave, onDelete, onCancel }: IncomeFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [account, setAccount] = useState(initial?.account ?? '');
  const [frequency, setFrequency] = useState<PayFrequency>(initial?.frequency ?? 'biweekly');
  const [anchor, setAnchor] = useState(initial?.firstPaydayAnchor ?? '');

  const valid = name.trim() && Number(amount) > 0 && anchor;

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
          {initial?.id ? 'Edit Income' : 'Add Income'}
        </div>

        <input style={inputStyle} placeholder="Name (e.g. Jason's Paycheck)" value={name} onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder="Amount per paycheck" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={inputStyle} placeholder="Account (e.g. Chase)" value={account} onChange={e => setAccount(e.target.value)} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Frequency</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FREQUENCIES.map(f => (
              <button key={f.value} onClick={() => setFrequency(f.value)} style={{
                padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
                background: frequency === f.value ? '#7c6af5' : '#1a1a2e',
                color: frequency === f.value ? '#fff' : '#888',
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Most recent payday</div>
        <input style={inputStyle} type="date" value={anchor} onChange={e => setAnchor(e.target.value)} />

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
            onClick={() => onSave({ name: name.trim(), amount: Number(amount), account: account.trim(), frequency, firstPaydayAnchor: anchor })}
            style={{
              flex: 2, padding: 12, borderRadius: 8, border: 'none', cursor: valid ? 'pointer' : 'default',
              background: valid ? '#4ade80' : '#2a2a4a', color: valid ? '#0f0f1a' : '#555', fontWeight: 700,
            }}
          >Save</button>
        </div>
      </div>
    </div>
  );
}
