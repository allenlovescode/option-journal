// All monetary values are per-share; multiply by 100 × qty for total dollars.

export function calcPnl(trade, currentPrice) {
  const qty = trade.quantity ?? 1;

  switch (trade.strategy) {
    case 'cash_secured_put': {
      const { strike, credit } = trade;
      const maxProfit = credit * 100 * qty;
      const maxLoss   = -(strike - credit) * 100 * qty;
      const intrinsicLoss = Math.max(0, strike - (currentPrice ?? strike));
      const estPnl    = (credit - intrinsicLoss) * 100 * qty;
      const breakeven = strike - credit;
      const isITM     = currentPrice != null && currentPrice < strike;
      return { maxProfit, maxLoss, estPnl, breakeven, isITM,
               putBreakeven: breakeven };
    }

    case 'put_credit_spread': {
      const { shortStrike, longStrike, netCredit } = trade;
      const width     = shortStrike - longStrike;
      const maxProfit = netCredit * 100 * qty;
      const maxLoss   = -(width - netCredit) * 100 * qty;
      const breakeven = shortStrike - netCredit;
      const isITM     = currentPrice != null && currentPrice < shortStrike;

      let pnlPerShare;
      if (currentPrice == null || currentPrice >= shortStrike) {
        pnlPerShare = netCredit;
      } else if (currentPrice <= longStrike) {
        pnlPerShare = netCredit - width;
      } else {
        pnlPerShare = netCredit - (shortStrike - currentPrice);
      }
      return { maxProfit, maxLoss, estPnl: pnlPerShare * 100 * qty,
               breakeven, isITM, putBreakeven: breakeven };
    }

    case 'call_credit_spread': {
      const { shortStrike, longStrike, netCredit } = trade;
      const width     = longStrike - shortStrike;
      const maxProfit = netCredit * 100 * qty;
      const maxLoss   = -(width - netCredit) * 100 * qty;
      const breakeven = shortStrike + netCredit;
      const isITM     = currentPrice != null && currentPrice > shortStrike;

      let pnlPerShare;
      if (currentPrice == null || currentPrice <= shortStrike) {
        pnlPerShare = netCredit;
      } else if (currentPrice >= longStrike) {
        pnlPerShare = netCredit - width;
      } else {
        pnlPerShare = netCredit - (currentPrice - shortStrike);
      }
      return { maxProfit, maxLoss, estPnl: pnlPerShare * 100 * qty,
               breakeven, isITM, callBreakeven: breakeven };
    }

    case 'iron_condor': {
      const { longPutStrike, shortPutStrike, shortCallStrike, longCallStrike, netCredit } = trade;
      const putWidth  = shortPutStrike - longPutStrike;
      const callWidth = longCallStrike - shortCallStrike;
      const maxWidth  = Math.max(putWidth, callWidth);
      const maxProfit = netCredit * 100 * qty;
      const maxLoss   = -(maxWidth - netCredit) * 100 * qty;

      let pnlPerShare;
      const sp = currentPrice;
      if (sp == null || (sp >= shortPutStrike && sp <= shortCallStrike)) {
        pnlPerShare = netCredit;
      } else if (sp < shortPutStrike) {
        const shortPutIntr = shortPutStrike - sp;
        const longPutIntr  = Math.max(0, longPutStrike - sp);
        pnlPerShare = netCredit - (shortPutIntr - longPutIntr);
      } else {
        const shortCallIntr = sp - shortCallStrike;
        const longCallIntr  = Math.max(0, sp - longCallStrike);
        pnlPerShare = netCredit - (shortCallIntr - longCallIntr);
      }

      const isITM = sp != null && (sp < shortPutStrike || sp > shortCallStrike);
      return {
        maxProfit, maxLoss, estPnl: pnlPerShare * 100 * qty, isITM,
        putBreakeven:  shortPutStrike  - netCredit,
        callBreakeven: shortCallStrike + netCredit,
      };
    }

    case 'jade_lizard': {
      const { shortPutStrike, shortCallStrike, longCallStrike, netCredit } = trade;
      const callWidth = longCallStrike - shortCallStrike;
      const maxProfit = netCredit * 100 * qty;
      const upsidePnl = (netCredit - callWidth) * 100 * qty;
      const maxLoss   = -(shortPutStrike - netCredit) * 100 * qty;

      let pnlPerShare;
      const sp = currentPrice;
      if (sp == null || (sp >= shortPutStrike && sp <= shortCallStrike)) {
        pnlPerShare = netCredit;
      } else if (sp < shortPutStrike) {
        pnlPerShare = netCredit - (shortPutStrike - sp);
      } else if (sp >= longCallStrike) {
        pnlPerShare = netCredit - callWidth;
      } else {
        pnlPerShare = netCredit - (sp - shortCallStrike);
      }

      const isITM = sp != null && (sp < shortPutStrike || sp > shortCallStrike);
      return {
        maxProfit, maxLoss, upsidePnl, estPnl: pnlPerShare * 100 * qty, isITM,
        putBreakeven: shortPutStrike - netCredit,
        noUpsideRisk: netCredit >= callWidth,
      };
    }

    case 'covered_call': {
      const { callStrike, callPremium, sharesCostBasis } = trade;
      const maxProfit = (callStrike - sharesCostBasis + callPremium) * 100 * qty;
      const maxLoss   = -(sharesCostBasis - callPremium) * 100 * qty;
      const breakeven = sharesCostBasis - callPremium;

      let pnlPerShare;
      const sp = currentPrice;
      if (sp == null) {
        pnlPerShare = callPremium;
      } else if (sp >= callStrike) {
        pnlPerShare = callStrike - sharesCostBasis + callPremium;
      } else {
        pnlPerShare = sp - sharesCostBasis + callPremium;
      }
      const isITM = sp != null && sp > callStrike;
      return { maxProfit, maxLoss, estPnl: pnlPerShare * 100 * qty,
               breakeven, isITM, callBreakeven: callStrike };
    }

    default:
      return { maxProfit: 0, maxLoss: 0, estPnl: 0, isITM: false };
  }
}

export function getStatus(trade, currentPrice) {
  if (currentPrice == null) return 'unknown';
  const { strategy } = trade;

  switch (strategy) {
    case 'cash_secured_put':
      if (currentPrice >= trade.strike + 2) return 'safe';
      if (currentPrice >= trade.strike)     return 'warning';
      return 'danger';

    case 'put_credit_spread':
      if (currentPrice >= trade.shortStrike + 1) return 'safe';
      if (currentPrice >= trade.shortStrike)     return 'warning';
      if (currentPrice >= trade.longStrike)      return 'danger';
      return 'breach';

    case 'call_credit_spread':
      if (currentPrice <= trade.shortStrike - 1) return 'safe';
      if (currentPrice <= trade.shortStrike)     return 'warning';
      if (currentPrice <= trade.longStrike)      return 'danger';
      return 'breach';

    case 'iron_condor':
      if (currentPrice >= trade.shortPutStrike + 2 && currentPrice <= trade.shortCallStrike - 2) return 'safe';
      if (currentPrice >= trade.shortPutStrike && currentPrice <= trade.shortCallStrike) return 'warning';
      if (currentPrice >= trade.longPutStrike  && currentPrice <= trade.longCallStrike)  return 'danger';
      return 'breach';

    case 'jade_lizard':
      if (currentPrice >= trade.shortPutStrike + 2 && currentPrice <= trade.shortCallStrike) return 'safe';
      if (currentPrice < trade.shortPutStrike || currentPrice > trade.longCallStrike) return 'danger';
      return 'warning';

    case 'covered_call':
      if (currentPrice < trade.callStrike - 2) return 'safe';
      if (currentPrice < trade.callStrike)     return 'warning';
      return 'danger';

    default:
      return 'unknown';
  }
}

export const STATUS_CONFIG = {
  safe:    { label: 'Safe',      dot: 'bg-green-400',  text: 'text-green-400',  badge: 'bg-green-900/40 text-green-300 border-green-700' },
  warning: { label: 'Near',      dot: 'bg-yellow-400', text: 'text-yellow-400', badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-700' },
  danger:  { label: 'At Risk',   dot: 'bg-orange-400', text: 'text-orange-400', badge: 'bg-orange-900/40 text-orange-300 border-orange-700' },
  breach:  { label: 'Breached',  dot: 'bg-red-400',    text: 'text-red-400',    badge: 'bg-red-900/40 text-red-300 border-red-700' },
  unknown: { label: '—',         dot: 'bg-gray-500',   text: 'text-gray-400',   badge: 'bg-gray-800 text-gray-400 border-gray-700' },
};
