import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

function today() { return new Date().toISOString().split('T')[0]; }

// Fire-and-forget sync: only pushes the diff to Supabase
async function syncDiff(prev, next, userId) {
  if (!userId) return;
  const prevMap = new Map(prev.map(t => [t.id, t]));
  const nextMap = new Map(next.map(t => [t.id, t]));

  const deleted = prev.filter(t => !nextMap.has(t.id)).map(t => t.id);
  const changed = next.filter(t => prevMap.get(t.id) !== t); // reference diff

  try {
    if (deleted.length) {
      await supabase.from('trades').delete().in('id', deleted);
    }
    if (changed.length) {
      await supabase.from('trades').upsert(
        changed.map(t => ({ id: t.id, user_id: userId, data: t, updated_at: new Date().toISOString() }))
      );
    }
  } catch (err) {
    console.error('[useTrades] Supabase sync error:', err);
  }
}

export function useTrades() {
  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const userIdRef             = useRef(null);

  // Load trades from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userIdRef.current = user?.id ?? null;

      if (user) {
        const { data, error } = await supabase
          .from('trades')
          .select('data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          setTrades(data.map(r => r.data));
        }
      }
      setLoading(false);
    })();
  }, []);

  // Central state updater — syncs diff to Supabase as a side-effect
  const persist = useCallback((updater) => {
    setTrades(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncDiff(prev, next, userIdRef.current);
      return next;
    });
  }, []);

  // ── All mutations below are unchanged from the original ──────────────

  const addTrade = useCallback((data) => {
    const trade = { ...data, id: uuidv4(), openDate: today(), status: 'open', closeDate: null, closeDebit: null, realizedPnl: null, adjustments: [] };
    persist((prev) => [trade, ...prev]);
    return trade;
  }, [persist]);

  const closeTrade = useCallback((id, { closeDebit, closeQty, notes }) => {
    persist((prev) => {
      const trade = prev.find((t) => t.id === id);
      if (!trade) return prev;
      const credit    = trade.netCredit ?? trade.credit ?? trade.callPremium ?? 0;
      const totalQty  = trade.quantity ?? 1;
      const qtyToClose = closeQty ?? totalQty;
      const adjTotal  = (trade.adjustments ?? []).reduce((s, a) => s + (a.type === 'credit' ? a.amount : -a.amount), 0);
      const realizedPnl = ((credit - closeDebit) * 100 * qtyToClose) + adjTotal * 100 * (qtyToClose / totalQty);

      if (qtyToClose >= totalQty) {
        return prev.map((t) => t.id === id
          ? { ...t, status: 'closed', closeDate: today(), closeDebit, realizedPnl, notes: notes ?? t.notes }
          : t);
      }
      const closedRecord = { ...trade, id: uuidv4(), quantity: qtyToClose, status: 'closed', closeDate: today(), closeDebit, realizedPnl, notes: notes ?? trade.notes, adjustments: [] };
      return [closedRecord, ...prev.map((t) => t.id === id ? { ...t, quantity: totalQty - qtyToClose } : t)];
    });
  }, [persist]);

  const rollTrade = useCallback((id, { closeDebit, newTradeData }) => {
    persist((prev) => {
      const old = prev.find((t) => t.id === id);
      if (!old) return prev;
      const credit = old.netCredit ?? old.credit ?? old.callPremium ?? 0;
      const adjTotal = (old.adjustments ?? []).reduce((s, a) => s + (a.type === 'credit' ? a.amount : -a.amount), 0);
      const realizedPnl = ((credit - closeDebit) * 100 * (old.quantity ?? 1)) + adjTotal * 100 * (old.quantity ?? 1);
      const rollChainId = old.rollChainId ?? old.id;
      const newTrade = { ...newTradeData, id: uuidv4(), openDate: today(), status: 'open', closeDate: null, closeDebit: null, realizedPnl: null, adjustments: [], rolledFromId: id, rollChainId };
      const updated = prev.map((t) => t.id === id ? { ...t, status: 'rolled', closeDate: today(), closeDebit, realizedPnl, rolledToId: newTrade.id, rollChainId } : t);
      return [newTrade, ...updated];
    });
  }, [persist]);

  const markAssigned = useCallback((id, { assignmentDate, notes }) => {
    persist((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      if (t.strategy === 'cash_secured_put') {
        const credit = t.credit ?? 0;
        const assignedCostBasis = (t.strike ?? 0) - credit;
        return { ...t, status: 'assigned', closeDate: assignmentDate, assignedCostBasis, realizedPnl: credit * 100 * (t.quantity ?? 1), notes: notes ?? t.notes };
      }
      if (t.strategy === 'covered_call') {
        const realizedPnl = ((t.callStrike ?? 0) - (t.sharesCostBasis ?? 0) + (t.callPremium ?? 0)) * 100 * (t.quantity ?? 1);
        return { ...t, status: 'called_away', closeDate: assignmentDate, realizedPnl, notes: notes ?? t.notes };
      }
      return t;
    }));
  }, [persist]);

  const addAdjustment = useCallback((id, { type, amount, notes: adjNotes }) => {
    persist((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const entry = { id: uuidv4(), date: today(), type, amount: parseFloat(amount), notes: adjNotes };
      return { ...t, adjustments: [...(t.adjustments ?? []), entry] };
    }));
  }, [persist]);

  const deleteAdjustment = useCallback((tradeId, adjId) => {
    persist((prev) => prev.map((t) => t.id !== tradeId ? t : { ...t, adjustments: (t.adjustments ?? []).filter((a) => a.id !== adjId) }));
  }, [persist]);

  const deleteTrade = useCallback((id) => {
    persist((prev) => prev.filter((t) => t.id !== id));
  }, [persist]);

  const updateTrade = useCallback((id, data) => {
    persist((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, [persist]);

  const updateNotes = useCallback((id, notes) => {
    persist((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
  }, [persist]);

  const reopenTrade = useCallback((id) => {
    persist((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: 'open', closeDate: null, closeDebit: null, realizedPnl: null, rolledToId: undefined, assignedCostBasis: undefined } : t
    ));
  }, [persist]);

  const openTrades   = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status !== 'open');

  return { trades, loading, openTrades, closedTrades, addTrade, closeTrade, rollTrade, markAssigned, addAdjustment, deleteAdjustment, deleteTrade, updateTrade, updateNotes, reopenTrade };
}
