import { useState, useMemo } from 'react';
import { Plus, BookOpen, TrendingUp, AlertTriangle, Calendar, BarChart2, LogOut } from 'lucide-react';
import { useTrades } from './hooks/useTrades';
import { useMarketPrices } from './hooks/useMarketPrices';
import PositionsTable from './components/PositionsTable';
import ClosedTradesTable from './components/ClosedTradesTable';
import TradeFormModal from './components/TradeFormModal';
import PnlCharts from './components/PnlCharts';
import AuthGate from './components/AuthGate';
import { calcPnl, getStatus } from './utils/pnl';
import { fmt$, fmtPnl, pnlColor, dte } from './utils/format';
import { supabase } from './lib/supabase';

function StatCard({ icon: Icon, label, value, sub, valueClass = 'text-white' }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-700/60"><Icon size={18} className="text-gray-300" /></div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${valueClass}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const TABS = [
  { label: 'Open Positions', icon: TrendingUp },
  { label: 'Closed Trades',  icon: Calendar },
  { label: 'Analytics',      icon: BarChart2 },
];

function AppInner() {
  const { openTrades, closedTrades, loading, addTrade, closeTrade, rollTrade, markAssigned, addAdjustment, deleteAdjustment, deleteTrade, updateTrade, reopenTrade } = useTrades();
  const [tab, setTab]           = useState(0);
  const [showForm, setShowForm] = useState(false);

  const symbols = useMemo(() => [...new Set(openTrades.map((t) => t.symbol))], [openTrades]);
  const { prices, loading: loadingPrices, refresh } = useMarketPrices(symbols);

  const totalCredit = useMemo(() =>
    openTrades.reduce((s, t) => s + (t.netCredit ?? t.credit ?? t.callPremium ?? 0) * 100 * (t.quantity ?? 1), 0),
  [openTrades]);

  const totalEstPnl = useMemo(() =>
    openTrades.reduce((s, t) => s + (calcPnl(t, prices[t.symbol])?.estPnl ?? 0), 0),
  [openTrades, prices]);

  const atRiskCount = useMemo(() =>
    openTrades.filter((t) => { const s = getStatus(t, prices[t.symbol]); return s === 'danger' || s === 'breach'; }).length,
  [openTrades, prices]);

  const expiringCount = useMemo(() =>
    openTrades.filter((t) => { const d = dte(t.expiration); return d != null && d <= 7 && d >= 0; }).length,
  [openTrades]);

  const totalRealizedPnl = useMemo(() =>
    closedTrades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0),
  [closedTrades]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f1a' }}>
        <div className="text-gray-400 text-sm">Loading your trades…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0b0f1a' }}>
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0d1220' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg"><BookOpen size={20} className="text-blue-400" /></div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Option Journal</h1>
            <p className="text-xs text-gray-500">Trading position tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus size={16} /> Add Trade
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={TrendingUp}   label="Open Positions"    value={openTrades.length}        sub={`${symbols.length} symbols`} />
          <StatCard icon={TrendingUp}   label="Total Credit Open" value={fmt$(totalCredit)}         valueClass="text-green-400" sub="premium collected" />
          <StatCard icon={TrendingUp}   label="Est. P&L (open)"   value={fmtPnl(totalEstPnl)}      valueClass={pnlColor(totalEstPnl)} sub="intrinsic value basis" />
          <StatCard icon={AlertTriangle}label="At Risk"            value={atRiskCount}              valueClass={atRiskCount > 0 ? 'text-orange-400' : 'text-green-400'} sub="positions challenged" />
          <StatCard icon={Calendar}     label="Expiring ≤7d"       value={expiringCount}            valueClass={expiringCount > 0 ? 'text-yellow-400' : 'text-gray-300'} sub={`Realized: ${fmtPnl(totalRealizedPnl)}`} />
        </div>

        <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-700/60">
            {TABS.map(({ label, icon: Icon }, i) => {
              const count = i === 0 ? openTrades.length : i === 1 ? closedTrades.length : null;
              return (
                <button key={label} onClick={() => setTab(i)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${tab === i ? 'text-white border-b-2 border-blue-500 bg-gray-800/40' : 'text-gray-400 hover:text-gray-200'}`}>
                  <Icon size={14} />
                  {label}
                  {count != null && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${tab === i ? 'bg-blue-600/30 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            {tab === 0 && (
              <PositionsTable
                trades={openTrades} prices={prices} loadingPrices={loadingPrices}
                onRefresh={refresh} onClose={closeTrade} onDelete={deleteTrade}
                onUpdate={updateTrade} onRoll={rollTrade} onAssign={markAssigned}
                onAddAdjustment={addAdjustment} onDeleteAdjustment={deleteAdjustment}
                onAddClick={() => setShowForm(true)}
              />
            )}
            {tab === 1 && <ClosedTradesTable trades={closedTrades} onReopen={reopenTrade} />}
            {tab === 2 && <PnlCharts closedTrades={closedTrades} />}
          </div>
        </div>

        <p className="text-center text-xs text-gray-700">
          Est. P&L uses intrinsic value only — ignores time value. Click any row to expand details &amp; position actions.
        </p>
      </main>

      {showForm && <TradeFormModal onClose={() => setShowForm(false)} onAdd={addTrade} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppInner />
    </AuthGate>
  );
}
