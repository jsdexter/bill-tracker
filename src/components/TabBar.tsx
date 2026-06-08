type Tab = 'home' | 'bills' | 'income' | 'settings';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'bills', label: 'Bills', icon: '📋' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#0f0f1a', borderTop: '1px solid #1e1e2e',
      display: 'flex', justifyContent: 'space-around',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: active === t.id ? '#7c6af5' : '#555',
            fontSize: 10, padding: '4px 12px',
          }}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export type { Tab };
