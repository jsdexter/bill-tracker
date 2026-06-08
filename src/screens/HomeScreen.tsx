import { useBills } from '../context/BillsContext';
import { useIncome } from '../context/IncomeContext';
import {
  getWeekRange, getDaysUntil, formatMonth, formatShortDate,
  getPaydaysInMonth, isoDate, isInWeek,
} from '../utils/dates';

export default function HomeScreen() {
  const { bills, payments, togglePaid } = useBills();
  const { incomes, toggleReceived, isReceived } = useIncome();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentMonth = `${year}-${String(month).padStart(2, '0')}`;
  const { start: weekStart, end: weekEnd } = getWeekRange(now);

  // Payments for current month only
  const monthPayments = payments.filter(p => p.month === currentMonth);

  // Monthly totals for header
  const totalBills = monthPayments.reduce((s, p) => s + p.amount, 0);
  const incomeTotal = incomes.reduce((s, i) => {
    const days = getPaydaysInMonth(i, year, month);
    return s + days.length * i.amount;
  }, 0);
  const net = incomeTotal - totalBills;

  // This Week: bill payments + income paydays in current week
  const weekPayments = monthPayments.filter(p => {
    const bill = bills.find(b => b.id === p.billId);
    if (!bill) return false;
    const dueDate = new Date(year, month - 1, bill.dueDayOfMonth);
    return isInWeek(dueDate, weekStart, weekEnd);
  }).map(p => {
    const bill = bills.find(b => b.id === p.billId)!;
    const dueDate = new Date(year, month - 1, bill.dueDayOfMonth);
    return { type: 'payment' as const, payment: p, bill, dueDate };
  });

  const weekPaydays = incomes.flatMap(i =>
    getPaydaysInMonth(i, year, month)
      .filter(d => isInWeek(d, weekStart, weekEnd))
      .map(d => ({ type: 'payday' as const, income: i, date: d }))
  );

  const weekItems = [
    ...weekPayments,
    ...weekPaydays,
  ].sort((a, b) => {
    const da = a.type === 'payment' ? a.dueDate : a.date;
    const db2 = b.type === 'payment' ? b.dueDate : b.date;
    return da.getTime() - db2.getTime();
  });

  // Upcoming: unpaid bills and future paydays beyond this week
  const nextMonthStr = month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, '0')}`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const allMonthPayments = [...payments.filter(p => p.month === currentMonth), ...payments.filter(p => p.month === nextMonthStr)];

  const upcomingBills = allMonthPayments
    .filter(p => !p.paid)
    .map(p => {
      const bill = bills.find(b => b.id === p.billId);
      if (!bill) return null;
      const m = p.month === currentMonth ? month : nextMonth;
      const y = p.month === currentMonth ? year : nextYear;
      const dueDate = new Date(y, m - 1, bill.dueDayOfMonth);
      if (dueDate <= weekEnd) return null; // already in This Week
      return { type: 'payment' as const, payment: p, bill, dueDate };
    })
    .filter(Boolean) as { type: 'payment'; payment: typeof payments[0]; bill: typeof bills[0]; dueDate: Date }[];

  const upcomingPaydays = incomes.flatMap(i => {
    const thisMonth = getPaydaysInMonth(i, year, month);
    const nxtMonth = getPaydaysInMonth(i, nextYear, nextMonth);
    return [...thisMonth, ...nxtMonth]
      .filter(d => d > weekEnd)
      .map(d => ({ type: 'payday' as const, income: i, date: d }));
  });

  const upcomingItems = [...upcomingBills, ...upcomingPaydays]
    .sort((a, b) => {
      const da = a.type === 'payment' ? a.dueDate : a.date;
      const db2 = b.type === 'payment' ? b.dueDate : b.date;
      return da.getTime() - db2.getTime();
    })
    .slice(0, 10);

  const unpaidCount = monthPayments.filter(p => !p.paid).length;

  function billStatus(p: typeof payments[0], dueDate: Date): { label: string; color: string } {
    if (p.paid) return { label: '✓ paid', color: '#4ade80' };
    const days = getDaysUntil(dueDate);
    if (days < 0) return { label: '⚠ overdue', color: '#f87171' };
    if (days === 0) return { label: 'due today', color: '#fbbf24' };
    return { label: formatShortDate(dueDate), color: '#888' };
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMonth(year, month)}</div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
            {unpaidCount} bill{unpaidCount !== 1 ? 's' : ''} unpaid · ${monthPayments.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0).toLocaleString()} due
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: net >= 0 ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: 700 }}>
            {net >= 0 ? `+$${net.toLocaleString()}` : `-$${Math.abs(net).toLocaleString()}`} net
          </div>
          <div style={{ color: '#888', fontSize: 10 }}>
            ${incomeTotal.toLocaleString()} in · ${totalBills.toLocaleString()} out
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <div style={{ background: '#1a2e1a', border: '1px solid #4ade8040', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#4ade80' }}>
          📥 Income ${incomeTotal.toLocaleString()}
        </div>
        <div style={{ background: '#2e1a1a', border: '1px solid #f8717140', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#f87171' }}>
          📤 Bills ${totalBills.toLocaleString()}
        </div>
      </div>

      {/* This Week */}
      <div style={{ background: '#1e1b3a', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #7c6af540' }}>
        <div style={{ color: '#7c6af5', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
          ⚡ THIS WEEK · {formatShortDate(weekStart).toUpperCase()}–{formatShortDate(weekEnd).toUpperCase()}
        </div>

        {weekItems.length === 0 && (
          <div style={{ color: '#555', fontSize: 12, padding: '8px 0' }}>Nothing due this week</div>
        )}

        {weekItems.map((item, i) => {
          if (item.type === 'payday') {
            const received = isReceived(item.income.id, item.date);
            return (
              <div key={`pay-${item.income.id}-${isoDate(item.date)}`}
                onClick={() => toggleReceived(item.income.id, item.date)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#0a1f0a', borderRadius: 4, padding: '6px 8px',
                  marginBottom: i < weekItems.length - 1 ? 4 : 0, cursor: 'pointer',
                }}>
                <div>
                  <div style={{ color: '#4ade80' }}>💰 {item.income.name}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>{item.income.account} · {formatShortDate(item.date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4ade80' }}>+${item.income.amount.toLocaleString()}</div>
                  <div style={{ color: received ? '#4ade80' : '#888', fontSize: 10 }}>{received ? '✓ received' : 'expected'}</div>
                </div>
              </div>
            );
          }

          const { payment, bill, dueDate } = item;
          const status = billStatus(payment, dueDate);
          return (
            <div key={payment.id}
              onClick={() => togglePaid(payment.id, !payment.paid)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0',
                borderBottom: i < weekItems.length - 1 ? '1px solid #2a2a4a' : 'none',
                opacity: payment.paid ? 0.5 : 1, cursor: 'pointer',
              }}>
              <div>
                <div style={{ textDecoration: payment.paid ? 'line-through' : 'none', color: payment.paid ? '#888' : '#e0e0e0' }}>
                  {bill.name}
                </div>
                <div style={{ color: '#555', fontSize: 10 }}>{bill.account} · {formatShortDate(dueDate)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ textDecoration: payment.paid ? 'line-through' : 'none', color: payment.paid ? '#888' : '#e0e0e0' }}>
                  ${payment.amount.toLocaleString()}
                </div>
                <div style={{ color: status.color, fontSize: 10 }}>{status.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming */}
      <div style={{ color: '#888', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>UPCOMING</div>
      {upcomingItems.length === 0 && (
        <div style={{ color: '#555', fontSize: 12 }}>Nothing upcoming</div>
      )}
      {upcomingItems.map((item, i) => {
        if (item.type === 'payday') {
          const days = getDaysUntil(item.date);
          return (
            <div key={`up-pay-${item.income.id}-${isoDate(item.date)}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: i < upcomingItems.length - 1 ? '1px solid #1e1e2e' : 'none',
              }}>
              <div>
                <div style={{ color: '#4ade80' }}>💰 {item.income.name}</div>
                <div style={{ color: '#888', fontSize: 10 }}>{item.income.account} · {formatShortDate(item.date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#4ade80' }}>+${item.income.amount.toLocaleString()}</div>
                <div style={{ color: '#888', fontSize: 10 }}>{days} day{days !== 1 ? 's' : ''}</div>
              </div>
            </div>
          );
        }

        const { payment, bill, dueDate } = item;
        const days = getDaysUntil(dueDate);
        return (
          <div key={`up-bill-${payment.id}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: i < upcomingItems.length - 1 ? '1px solid #1e1e2e' : 'none',
            }}>
            <div>
              <div>{bill.name}</div>
              <div style={{ color: '#888', fontSize: 10 }}>{bill.account} · {formatShortDate(dueDate)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>${payment.amount.toLocaleString()}</div>
              <div style={{ color: '#888', fontSize: 10 }}>{days} day{days !== 1 ? 's' : ''}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
