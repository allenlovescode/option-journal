import { RotateCcw } from 'lucide-react';
import StrategyBadge from './StrategyBadge';
import { fmt$, fmtDate, fmtPnl, pnlColor } from '../utils/format';

const STATUS_LABELS = {
  closed:     { label: 'Closed',      cls: 'bg-gray-800 text-gray-400 border-gray-700' },
  rolled:     { label: 'Rolled',      cls: 'bg-blue-900/40 text-blue-300 border-blue-700' },
  assigned:   { label: 'Assigned',    cls: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  called_away:{ label: 'Called Away', cls: 'bg-purple-900/40 text-purple-300 border-purple-700' },
};

export default function ClosedTradesTable({ trades, onReopen }) {
  if (!trades.length) return <p className="text-center text-gray-600 py-10">No closed trades yet.</p>;

  const totalPnl = trades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="bg-gray-800 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-400">Total Realized P&amp;L: </span>
          <span className={`font-bold ${pnlColor(totalPnl)}`}>{fmtPnl(totalPnl)}</span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Symbol','Strategy','Status','Opened','Closed','Expiry','Qty','Credit/sh','Debit Close','Adjustments','P&L','Notes',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {trades.map((t) => {
              const credit = t.netCredit ?? t.credit ?? t.callPremium ?? 0;
              const adjs   = t.adjustments ?? [];
              const adjTotal = adjs.reduce((s, a) => s + (a.type === 'credit' ? a.amount : -a.amount), 0);
              const sl = STATUS_LABELS[t.status] ?? STATUS_LABELS.closed;

              return (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">
                    {t.symbol}
                    {t.rolledFromId && <span className="ml-1 text-[10px] text-blue-400 border border-blue-800 rounded px-1">ROLL</span>}
                  </td>
                  <td className="px-4 py-3"><StrategyBadge strategyId={t.strategy} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${sl.cls}`}>{sl.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(t.openDate)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(t.closeDate)}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(t.expiration)}</td>
                  <td className="px-4 py-3 text-gray-300">{t.quantity ?? 1}</td>
                  <td className="px-4 py-3 text-green-400">{fmt$(credit)}</td>
                  <td className="px-4 py-3 text-red-400">{t.closeDebit != null ? fmt$(t.closeDebit) : '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {adjs.length > 0 ? (
                      <span className={adjTotal >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {adjTotal >= 0 ? '+' : ''}{fmt$(adjTotal)}/sh ({adjs.length})
                      </span>
                    ) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${pnlColor(t.realizedPnl)}`}>{fmtPnl(t.realizedPnl)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {t.status === 'assigned' && t.assignedCostBasis != null
                      ? <span className="text-orange-400">Cost basis: {fmt$(t.assignedCostBasis)}/sh</span>
                      : (t.notes || '—')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { if (window.confirm(`Reopen ${t.symbol}? This will move it back to open positions.`)) onReopen(t.id); }}
                      className="p-1.5 rounded bg-teal-900/40 hover:bg-teal-800/60 text-teal-400 border border-teal-800 transition-colors"
                      title="Reopen trade">
                      <RotateCcw size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
