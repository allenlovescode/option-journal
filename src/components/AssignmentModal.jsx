import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { fmt$ } from '../utils/format';

export default function AssignmentModal({ trade, onClose, onConfirm }) {
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const isCSP  = trade.strategy === 'cash_secured_put';
  const isCC   = trade.strategy === 'covered_call';
  const qty    = trade.quantity ?? 1;

  // CSP
  const cspCredit       = trade.credit ?? 0;
  const cspCostBasis    = (trade.strike ?? 0) - cspCredit;
  const cspPremiumKept  = cspCredit * 100 * qty;

  // Covered Call
  const ccPnl = ((trade.callStrike ?? 0) - (trade.sharesCostBasis ?? 0) + (trade.callPremium ?? 0)) * 100 * qty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-orange-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">{isCSP ? 'Mark as Assigned' : 'Mark as Called Away'}</h2>
              <p className="text-xs text-gray-500">{trade.symbol}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isCSP && (
            <div className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-orange-300">CSP Assignment Details</p>
              <div className="space-y-1 text-gray-300">
                <div className="flex justify-between"><span className="text-gray-400">Assigned shares</span><span>{qty * 100} shares of {trade.symbol}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Assignment price</span><span>{fmt$(trade.strike)}/share</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Premium collected</span><span className="text-green-400">{fmt$(cspCredit)}/share</span></div>
                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1"><span className="text-gray-400">Effective cost basis</span><span className="text-white font-semibold">{fmt$(cspCostBasis)}/share</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Premium kept (realized)</span><span className="text-green-400 font-semibold">+{fmt$(cspPremiumKept)}</span></div>
              </div>
            </div>
          )}

          {isCC && (
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-blue-300">Covered Call — Called Away</p>
              <div className="space-y-1 text-gray-300">
                <div className="flex justify-between"><span className="text-gray-400">Shares sold</span><span>{qty * 100} shares at {fmt$(trade.callStrike)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Cost basis</span><span>{fmt$(trade.sharesCostBasis)}/share</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Call premium</span><span className="text-green-400">{fmt$(trade.callPremium)}/share</span></div>
                <div className="flex justify-between border-t border-gray-700 pt-1 mt-1"><span className="text-gray-400">Total realized P&L</span><span className={`font-semibold ${ccPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{ccPnl >= 0 ? '+' : ''}{fmt$(ccPnl)}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Assignment Date</label>
            <input type="date" value={assignmentDate} onChange={e => setAssignmentDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={() => { onConfirm({ assignmentDate, notes }); onClose(); }}
            className="flex-1 px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors">
            Confirm {isCSP ? 'Assignment' : 'Call Away'}
          </button>
        </div>
      </div>
    </div>
  );
}
