import { useState } from 'react';
import { BillsProvider, useBills } from './context/BillsContext';
import { IncomeProvider } from './context/IncomeContext';
import TabBar, { Tab } from './components/TabBar';
import HomeScreen from './screens/HomeScreen';
import BillsScreen from './screens/BillsScreen';
import IncomeScreen from './screens/IncomeScreen';
import SettingsScreen from './screens/SettingsScreen';

function Shell() {
  const [tab, setTab] = useState<Tab>('home');
  const { uid, loading } = useBills();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#555' }}>
        Loading…
      </div>
    );
  }

  return (
    <IncomeProvider uid={uid}>
      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 72 }}>
        {tab === 'home' && <HomeScreen />}
        {tab === 'bills' && <BillsScreen />}
        {tab === 'income' && <IncomeScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </IncomeProvider>
  );
}

export default function App() {
  return (
    <BillsProvider>
      <Shell />
    </BillsProvider>
  );
}
