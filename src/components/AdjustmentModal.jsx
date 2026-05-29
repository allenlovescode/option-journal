import { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';

export default function AdjustmentModal({ trade, onClose, onConfirm }) {
  const [type, setType]     = useState('debit');
  const [amount, setAmount] = useState('');
  const [notes, setNotes]   = useState('');

  const canSubmit = amount !== '' && parseFloat(amount) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Add Adjustment</h2>
              <p className="text-xs text-gray-500">{trade.symbol}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('debit')}
                className={`py-2 rounded text-sm font-medium border transition-all ${type === 'debit' ? 'bg-red-900/50 border-red-600 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                Debit (paid)
              </button>
              <button type="button" onClick={() => setType('credit')}
                className={`py-2 rounded text-sm font-medium border transition-all ${type === 'credit' ? 'bg-green-900/50 border-green-600 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                Credit (received)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Amount <span className="text-gray-500">(per share)</span></label>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.50"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="e.g. Rolled down, bought protection..."
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">Cancel</button>
          <button disabled={!canSubmit}
            onClick={() => { onConfirm({ type, amount, notes }); onClose(); }}
            className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
            Add Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}
