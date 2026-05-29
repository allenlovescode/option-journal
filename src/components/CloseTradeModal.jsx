import { useState } from 'react';
import { X } from 'lucide-react';
import { getStrategy } from '../utils/strategies';
import { fmt$ } from '../utils/format';

export default function CloseTradeModal({ trade, onClose, onConfirm }) {
  const [closeDebit, setCloseDebit] = useState('');
  const [closeQty, setCloseQty]     = useState(trade.quantity ?? 1);
  const [notes, setNotes]           = useState(trade.notes ?? '');

  const credit      = trade.netCredit ?? trade.credit ?? trade.callPremium ?? 0;
  const totalQty    = trade.quantity ?? 1;
  const debit       = parseFloat(closeDebit) || 0;
  const qty         = Math.min(Math.max(1, parseInt(closeQty) || 1), totalQty);
  const realizedPnl = (credit - debit) * 100 * qty;
  const isPartial   = qty < totalQty;
  const strategy    = getStrategy(trade.strategy);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Close Position</h2>
            <p className="text-sm text-gray-400">{trade.symbol} — {strategy.label}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Original credit</span>
              <span className="text-green-400 font-medium">{fmt$(credit)} / share</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total contracts</span>
              <span className="text-white">{totalQty}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Contracts to Close
              </label>
              <input
                type="number"
                min="1"
                max={totalQty}
                value={closeQty}
                onChange={(e) => setCloseQty(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              {totalQty > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  {isPartial ? `${totalQty - qty} contract${totalQty - qty > 1 ? 's' : ''} remain open` : 'Full close'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Debit to Close <span className="text-gray-500">(per share)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={closeDebit}
                onChange={(e) => setCloseDebit(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {closeDebit !== '' && (
            <div className={`rounded-lg p-3 text-sm font-semibold text-center ${
              realizedPnl >= 0 ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'
            }`}>
              Realized P&amp;L: {realizedPnl >= 0 ? '+' : ''}{fmt$(realizedPnl)}
              {isPartial && <span className="text-xs font-normal text-gray-400 ml-2">({qty} of {totalQty} contracts)</span>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm({ closeDebit: debit, closeQty: qty, notes }); onClose(); }}
            className="flex-1 px-4 py-2 rounded bg-green-700 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
          >
            Confirm Close
          </button>
        </div>
      </div>
    </div>
  );
}
