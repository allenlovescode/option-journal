import React, { useState } from 'react';
import { RefreshCw, Plus, Trash2, CheckSquare, ChevronDown, ChevronUp, TrendingUp, Pencil, ArrowRight, AlertCircle, PlusCircle, X } from 'lucide-react';
import StrategyBadge from './StrategyBadge';
import StrikesDisplay from './StrikesDisplay';
import CloseTradeModal from './CloseTradeModal';
import TradeFormModal from './TradeFormModal';
import RollTradeModal from './RollTradeModal';
import AssignmentModal from './AssignmentModal';
import AdjustmentModal from './AdjustmentModal';
import { calcPnl, getStatus, STATUS_CONFIG } from '../utils/pnl';
import { fmt$, fmtPnl, fmtDate, dteLabel, dte, pnlColor } from '../utils/format';

function CreditLabel(trade) {
  const credit = trade.netCredit ?? trade.credit ?? trade.callPremium ?? 0;
  return fmt$(credit);
}

function TotalCredit(trade) {
  const credit = trade.netCredit ?? trade.credit ?? trade.callPremium ?? 0;
  return fmt$(credit * 100 * (trade.quantity ?? 1));
}

export default function PositionsTable({ trades, prices, loadingPrices, onRefresh, onClose, onDelete, onUpdate, onRoll, onAssign, onAddAdjustment, onDeleteAdjustment, onAddClick }) {
  const [closing, setClosing]     = useState(null);
  const [editing, setEditing]     = useState(null);
  const [rolling, setRolling]     = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [sortBy, setSortBy]       = useState('expiration');
  const [sortDir, setSortDir]     = useState('asc');

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortDir('asc'); }
  };

  const sorted = [...trades].sort((a, b) => {
    let va, vb;
    if (sortBy === 'expiration') { va = a.expiration; vb = b.expiration; }
    else if (sortBy === 'symbol') { va = a.symbol; vb = b.symbol; }
    else if (sortBy === 'dte') { va = dte(a.expiration) ?? 999; vb = dte(b.expiration) ?? 999; }
    else if (sortBy === 'pnl') { va = calcPnl(a, prices[a.symbol])?.estPnl ?? 0; vb = calcPnl(b, prices[b.symbol])?.estPnl ?? 0; }
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortHeader = ({ col, children }) => (
    <th onClick={() => toggleSort(col)} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-200 whitespace-nowrap">
      <span className="inline-flex items-center gap-1">{children}{sortBy === col && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</span>
    </th>
  );

  const canAssign = (t) => t.strategy === 'cash_secured_put' || t.strategy === 'covered_call';

  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TrendingUp size={48} className="text-gray-700 mb-4" />
        <p className="text-gray-400 text-lg font-medium">No open positions</p>
        <p className="text-gray-600 text-sm mt-1">Add your first trade to start tracking</p>
        <button onClick={onAddClick} className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
          <Plus size={16} /> Add Trade
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <SortHeader col="symbol">Symbol</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strategy</th>
              <SortHeader col="expiration">Expiry</SortHeader>
              <SortHeader col="dte">DTE</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strikes</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Credit/sh</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">Mkt Price
                  <button onClick={onRefresh} className={`text-gray-500 hover:text-blue-400 transition-colors ${loadingPrices ? 'animate-spin' : ''}`}><RefreshCw size={11} /></button>
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <SortHeader col="pnl">Est. P&L</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Max P / Max L</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {sorted.map((trade) => {
              const price      = prices[trade.symbol];
              const pnl        = calcPnl(trade, price);
              const status     = getStatus(trade, price);
              const sc         = STATUS_CONFIG[status];
              const days       = dte(trade.expiration);
              const isExpiring = days != null && days <= 7 && days >= 0;
              const isExpanded = expanded === trade.id;
              const adjs       = trade.adjustments ?? [];

              return (
                <React.Fragment key={trade.id}>
                  <tr className="hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => setExpanded(isExpanded ? null : trade.id)}>
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      {trade.symbol}
                      {trade.rolledFromId && <span className="ml-1 text-[10px] text-blue-400 border border-blue-800 rounded px-1">ROLL</span>}
                    </td>
                    <td className="px-4 py-3"><StrategyBadge strategyId={trade.strategy} /></td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fmtDate(trade.expiration)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-medium ${isExpiring ? 'text-orange-400' : 'text-gray-300'}`}>{dteLabel(trade.expiration)}</span>
                    </td>
                    <td className="px-4 py-3"><StrikesDisplay trade={trade} currentPrice={price} /></td>
                    <td className="px-4 py-3 text-gray-300">{trade.quantity ?? 1}</td>
                    <td className="px-4 py-3 text-green-400 font-medium whitespace-nowrap">{CreditLabel(trade)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {price != null ? <span className="text-blue-300 font-semibold">${price.toFixed(2)}</span> : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-semibold ${pnlColor(pnl.estPnl)}`}>
                        {price != null ? fmtPnl(pnl.estPnl) : <span className="text-gray-600">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="text-green-400">{fmt$(pnl.maxProfit)}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-red-400">-{fmt$(Math.abs(pnl.maxLoss))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setEditing(trade)} className="p-1.5 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => setClosing(trade)} className="p-1.5 rounded bg-green-900/40 hover:bg-green-700/50 text-green-400 transition-colors" title="Close position"><CheckSquare size={14} /></button>
                        <button onClick={() => { if (window.confirm('Delete this trade?')) onDelete(trade.id); }} className="p-1.5 rounded bg-red-900/40 hover:bg-red-800/60 text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr key={`${trade.id}-exp`} className="bg-gray-800/20">
                      <td colSpan={12} className="px-6 py-4">
                        {/* Info row */}
                        <div className="flex flex-wrap gap-6 text-xs text-gray-400 mb-3">
                          <span><span className="text-gray-500">Opened:</span> {fmtDate(trade.openDate)}</span>
                          {pnl.breakeven     != null && <span><span className="text-gray-500">Breakeven:</span> ${pnl.breakeven.toFixed(2)}</span>}
                          {pnl.putBreakeven  != null && pnl.breakeven == null && <span><span className="text-gray-500">Put BE:</span> ${pnl.putBreakeven.toFixed(2)}</span>}
                          {pnl.callBreakeven != null && <span><span className="text-gray-500">Call BE:</span> ${pnl.callBreakeven.toFixed(2)}</span>}
                          <span><span className="text-gray-500">Total credit:</span> <span className="text-green-400">{TotalCredit(trade)}</span></span>
                          {trade.strategy === 'jade_lizard' && (
                            <span className={pnl.noUpsideRisk ? 'text-teal-400' : 'text-orange-400'}>
                              {pnl.noUpsideRisk ? '✓ No upside risk' : '⚠ Upside risk present'}
                            </span>
                          )}
                        </div>

                        {/* Adjustments list */}
                        {adjs.length > 0 && (
                          <div className="mb-3 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Adjustments</p>
                            {adjs.map((a) => (
                              <div key={a.id} className="flex items-center gap-3 text-xs bg-gray-800/60 rounded px-3 py-1.5">
                                <span className="text-gray-500">{a.date}</span>
                                <span className={a.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                                  {a.type === 'credit' ? '+' : '-'}{fmt$(a.amount)}/sh
                                </span>
                                {a.notes && <span className="text-gray-500 italic">{a.notes}</span>}
                                <button onClick={() => onDeleteAdjustment(trade.id, a.id)} className="ml-auto text-gray-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {trade.notes && <p className="text-xs text-gray-500 italic mb-3">"{trade.notes}"</p>}

                        {/* Position management actions */}
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setRolling(trade)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 border border-blue-800 transition-colors">
                            <ArrowRight size={13} /> Roll Position
                          </button>
                          {canAssign(trade) && (
                            <button onClick={() => setAssigning(trade)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-orange-900/40 hover:bg-orange-800/50 text-orange-300 border border-orange-800 transition-colors">
                              <AlertCircle size={13} /> {trade.strategy === 'covered_call' ? 'Called Away' : 'Mark Assigned'}
                            </button>
                          )}
                          <button onClick={() => setAdjusting(trade)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 border border-purple-800 transition-colors">
                            <PlusCircle size={13} /> Add Adjustment
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {closing   && <CloseTradeModal trade={closing}   onClose={() => setClosing(null)}   onConfirm={(d) => onClose(closing.id, d)} />}
      {editing   && <TradeFormModal  initialTrade={editing} onClose={() => setEditing(null)} onSave={(d) => { onUpdate(editing.id, d); setEditing(null); }} />}
      {rolling   && <RollTradeModal  trade={rolling}   onClose={() => setRolling(null)}   onConfirm={(d) => onRoll(rolling.id, d)} />}
      {assigning && <AssignmentModal trade={assigning} onClose={() => setAssigning(null)} onConfirm={(d) => onAssign(assigning.id, d)} />}
      {adjusting && <AdjustmentModal trade={adjusting} onClose={() => setAdjusting(null)} onConfirm={(d) => onAddAdjustment(adjusting.id, d)} />}
    </>
  );
}
