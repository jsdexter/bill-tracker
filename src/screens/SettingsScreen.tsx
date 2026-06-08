export default function SettingsScreen() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Settings</div>

      <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Bill Tracker</div>
        <div style={{ color: '#888', fontSize: 12 }}>Version 1.0.0</div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
          A simple bill reminder app. Track your recurring bills, mark them paid, and see your income vs. expenses at a glance.
        </div>
      </div>

      <div style={{ color: '#555', fontSize: 11, textAlign: 'center', marginTop: 32 }}>
        More settings coming soon
      </div>
    </div>
  );
}
