import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import { getStrategy } from '../utils/strategies';
import { fmt$, fmtPnl, pnlColor } from '../utils/format';

const AXIS_COLOR  = '#6B7280';
const GRID_COLOR  = '#1F2937';

function StatCard({ label, value, valueClass = 'text-white', sub }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

const TooltipBox = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#fff' }} className="font-semibold">
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function PnlCharts({ closedTrades }) {
  const { stats, equityCurve, monthlyData, strategyData } = useMemo(() => {
    const sorted = [...closedTrades].sort((a, b) => (a.closeDate ?? '').localeCompare(b.closeDate ?? ''));

    // Equity curve
    let cum = 0;
    const equityCurve = sorted.map((t, i) => {
      cum += t.realizedPnl ?? 0;
      return { idx: i + 1, label: `${t.symbol} (${t.closeDate})`, pnl: t.realizedPnl ?? 0, cumulative: cum };
    });

    // Monthly
    const monthMap = {};
    closedTrades.forEach((t) => {
      if (!t.closeDate) return;
      const key = t.closeDate.slice(0, 7);
      monthMap[key] = (monthMap[key] ?? 0) + (t.realizedPnl ?? 0);
    });
    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, pnl]) => ({ month: format(parseISO(k + '-01'), 'MMM yy'), pnl }));

    // By strategy
    const stratMap = {};
    closedTrades.forEach((t) => {
      stratMap[t.strategy] = (stratMap[t.strategy] ?? 0) + (t.realizedPnl ?? 0);
    });
    const strategyData = Object.entries(stratMap).map(([id, pnl]) => ({
      name: getStrategy(id).abbr, fullName: getStrategy(id).label, pnl,
    })).sort((a, b) => b.pnl - a.pnl);

    // Stats
    const winners  = closedTrades.filter((t) => (t.realizedPnl ?? 0) > 0);
    const losers   = closedTrades.filter((t) => (t.realizedPnl ?? 0) < 0);
    const totalPnl = closedTrades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    const winRate  = closedTrades.length ? Math.round(winners.length / closedTrades.length * 100) : 0;
    const avgWin   = winners.length ? winners.reduce((s, t) => s + t.realizedPnl, 0) / winners.length : 0;
    const avgLoss  = losers.length  ? losers.reduce((s, t) => s + t.realizedPnl, 0)  / losers.length  : 0;
    const stats = { totalPnl, winRate, avgWin, avgLoss, total: closedTrades.length, winners: winners.length, losers: losers.length };

    return { stats, equityCurve, monthlyData, strategyData };
  }, [closedTrades]);

  if (!closedTrades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-400 text-lg font-medium">No closed trades yet</p>
        <p className="text-gray-600 text-sm mt-1">Close some positions to see your P&L analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Realized P&L" value={fmtPnl(stats.totalPnl)} valueClass={pnlColor(stats.totalPnl)} sub={`${stats.total} trades closed`} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} valueClass={stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'} sub={`${stats.winners}W / ${stats.losers}L`} />
        <StatCard label="Avg Win" value={fmtPnl(stats.avgWin)} valueClass="text-green-400" />
        <StatCard label="Avg Loss" value={fmtPnl(stats.avgLoss)} valueClass="text-red-400" />
        <StatCard label="Profit Factor" value={stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss).toFixed(2) : '—'} valueClass="text-blue-300" sub="avg win / avg loss" />
      </div>

      {/* Equity curve */}
      <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Equity Curve — Cumulative P&L</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={equityCurve} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
            <XAxis dataKey="idx" tick={{ fill: AXIS_COLOR, fontSize: 11 }} label={{ value: 'Trade #', position: 'insideBottom', offset: -2, fill: AXIS_COLOR, fontSize: 11 }} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v).toFixed(0)}`} />
            <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
            <Tooltip content={<TooltipBox formatter={v => fmtPnl(v)} />}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''} />
            <Line type="monotone" dataKey="cumulative" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly P&L */}
        <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly P&L</h3>
          {monthlyData.length < 2 ? (
            <p className="text-gray-600 text-xs text-center py-8">Need trades across 2+ months</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
                <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickFormatter={v => `$${Math.abs(v).toFixed(0)}`} />
                <ReferenceLine y={0} stroke="#374151" />
                <Tooltip content={<TooltipBox formatter={v => fmtPnl(v)} />} />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* P&L by Strategy */}
        <div className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">P&L by Strategy</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={strategyData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} tickFormatter={v => `$${Math.abs(v).toFixed(0)}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} width={40} />
              <ReferenceLine x={0} stroke="#374151" />
              <Tooltip content={<TooltipBox formatter={v => fmtPnl(v)} />}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''} />
              <Bar dataKey="pnl" radius={[0, 3, 3, 0]}>
                {strategyData.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
