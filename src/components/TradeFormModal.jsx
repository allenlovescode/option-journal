import { useState } from 'react';
import { X } from 'lucide-react';
import { STRATEGIES } from '../utils/strategies';
import { DEFAULTS, STRATEGY_FORMS, validate } from '../utils/strategyForms.jsx';

export default function TradeFormModal({ onClose, onAdd, onSave, initialTrade }) {
  const editMode = !!initialTrade;

  const [strategy, setStrategy] = useState(initialTrade?.strategy ?? 'cash_secured_put');
  const [fields, setFields] = useState(() => {
    if (initialTrade) {
      const { id, status, openDate, closeDate, closeDebit, realizedPnl, strategy: _s, adjustments, rolledFromId, rolledToId, rollChainId, ...rest } = initialTrade;
      return { ...DEFAULTS[initialTrade.strategy], ...rest };
    }
    return DEFAULTS.cash_secured_put;
  });

  const setF = (patch) => setFields((prev) => ({ ...prev, ...patch }));

  const handleStrategyChange = (id) => {
    setStrategy(id);
    setFields(DEFAULTS[id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate(strategy, fields)) return;
    editMode ? onSave({ strategy, ...fields }) : onAdd({ strategy, ...fields });
    onClose();
  };

  const FormBody = STRATEGY_FORMS[strategy];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">{editMode ? 'Edit Trade' : 'Add New Trade'}</h2>
            {editMode && <p className="text-xs text-gray-500 mt-0.5">{initialTrade.symbol} — opened {initialTrade.openDate}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 scrollbar-thin">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {STRATEGIES.map((s) => (
                  <button key={s.id} type="button" onClick={() => handleStrategyChange(s.id)}
                    className={`px-3 py-2 rounded text-sm font-medium border transition-all ${strategy === s.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <hr className="border-gray-700" />
            <FormBody f={fields} set={setF} />
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Notes (optional)</label>
              <textarea value={fields.notes} onChange={(e) => setF({ notes: e.target.value })} rows={2}
                placeholder="Thesis, IV rank, setup notes..."
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!validate(strategy, fields)}
              className={`flex-1 px-4 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors ${editMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {editMode ? 'Save Changes' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
