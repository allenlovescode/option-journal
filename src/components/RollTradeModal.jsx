import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { STRATEGIES } from '../utils/strategies';
import { DEFAULTS, STRATEGY_FORMS, validate } from '../utils/strategyForms.jsx';
import { fmt$, fmtDate } from '../utils/format';

export default function RollTradeModal({ trade, onClose, onConfirm }) {
  const [closeDebit, setCloseDebit] = useState('');
  const [strategy, setStrategy]     = useState(trade.strategy);
  const [fields, setFields]         = useState({ ...DEFAULTS[trade.strategy], symbol: trade.symbol, quantity: trade.quantity ?? 1 });

  const setF = (patch) => setFields((prev) => ({ ...prev, ...patch }));

  const origCredit = trade.netCredit ?? trade.credit ?? trade.callPremium ?? 0;
  const qty        = trade.quantity ?? 1;
  const debit      = parseFloat(closeDebit) || 0;
  const rollPnl    = (origCredit - debit) * 100 * qty;

  const newCredit   = fields.netCredit ?? fields.credit ?? fields.callPremium ?? 0;
  const totalCredit = origCredit - debit + (parseFloat(newCredit) || 0);

  const canSubmit = closeDebit !== '' && validate(strategy, fields);

  const FormBody = STRATEGY_FORMS[strategy];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRight size={18} className="text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Roll Position</h2>
              <p className="text-xs text-gray-500">{trade.symbol} — {STRATEGIES.find(s => s.id === trade.strategy)?.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 scrollbar-thin">
          {/* Current position summary */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 text-sm space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Position</p>
            <div className="flex gap-6 flex-wrap text-gray-300">
              <span><span className="text-gray-500">Expiry:</span> {fmtDate(trade.expiration)}</span>
              <span><span className="text-gray-500">Credit:</span> <span className="text-green-400">{fmt$(origCredit)}/sh</span></span>
              <span><span className="text-gray-500">Qty:</span> {qty}</span>
            </div>
          </div>

          {/* Close debit */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Debit to Close Current Position <span className="text-gray-500">(per share)</span>
            </label>
            <input type="number" step="0.01" min="0" value={closeDebit} onChange={e => setCloseDebit(e.target.value)}
              placeholder="0.05"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>

          {closeDebit !== '' && (
            <div className={`rounded-lg px-4 py-2 text-sm flex gap-6 ${rollPnl >= 0 ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <span className="text-gray-400">Close P&L: <span className={rollPnl >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{rollPnl >= 0 ? '+' : ''}{fmt$(rollPnl)}</span></span>
              <span className="text-gray-400">Net roll credit: <span className="text-blue-300 font-semibold">{fmt$(totalCredit)}/sh</span></span>
            </div>
          )}

          <hr className="border-gray-700" />

          {/* New position */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">New Position</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-400 mb-2">Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {STRATEGIES.map((s) => (
                  <button key={s.id} type="button"
                    onClick={() => { setStrategy(s.id); setFields({ ...DEFAULTS[s.id], symbol: trade.symbol, quantity: qty }); }}
                    className={`px-3 py-2 rounded text-sm font-medium border transition-all ${strategy === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <FormBody f={fields} set={setF} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes (optional)</label>
            <textarea value={fields.notes} onChange={e => setF({ notes: e.target.value })} rows={2}
              placeholder="Reason for roll, adjustment thesis..."
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
          <button disabled={!canSubmit}
            onClick={() => { onConfirm({ closeDebit: debit, newTradeData: { strategy, ...fields } }); onClose(); }}
            className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            Confirm Roll
          </button>
        </div>
      </div>
    </div>
  );
}
