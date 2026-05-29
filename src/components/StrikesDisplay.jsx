// Compact inline display of a position's strikes

export default function StrikesDisplay({ trade, currentPrice }) {
  const { strategy } = trade;

  const pill = (label, value, highlight = false) => (
    <span
      key={label}
      className={`inline-flex flex-col items-center px-2 py-1 rounded text-xs leading-tight border
        ${highlight
          ? 'bg-yellow-900/40 border-yellow-600 text-yellow-300'
          : 'bg-gray-800 border-gray-600 text-gray-300'}`}
    >
      <span className="font-semibold">{value}</span>
      <span className="text-gray-500 text-[10px]">{label}</span>
    </span>
  );

  const near = (strike) =>
    currentPrice != null && Math.abs(currentPrice - strike) / strike < 0.02;

  switch (strategy) {
    case 'cash_secured_put':
      return <div className="flex gap-1">{pill('PUT', trade.strike, near(trade.strike))}</div>;

    case 'put_credit_spread':
      return (
        <div className="flex gap-1 items-center">
          {pill('S-PUT', trade.shortStrike, near(trade.shortStrike))}
          <span className="text-gray-600 text-xs">/</span>
          {pill('L-PUT', trade.longStrike, near(trade.longStrike))}
        </div>
      );

    case 'call_credit_spread':
      return (
        <div className="flex gap-1 items-center">
          {pill('S-CALL', trade.shortStrike, near(trade.shortStrike))}
          <span className="text-gray-600 text-xs">/</span>
          {pill('L-CALL', trade.longStrike, near(trade.longStrike))}
        </div>
      );

    case 'iron_condor':
      return (
        <div className="flex gap-1 items-center flex-wrap">
          {pill('L-PUT',  trade.longPutStrike,    near(trade.longPutStrike))}
          {pill('S-PUT',  trade.shortPutStrike,   near(trade.shortPutStrike))}
          <span className="text-gray-600 text-xs">|</span>
          {pill('S-CALL', trade.shortCallStrike,  near(trade.shortCallStrike))}
          {pill('L-CALL', trade.longCallStrike,   near(trade.longCallStrike))}
        </div>
      );

    case 'jade_lizard':
      return (
        <div className="flex gap-1 items-center">
          {pill('S-PUT',  trade.shortPutStrike,  near(trade.shortPutStrike))}
          <span className="text-gray-600 text-xs">|</span>
          {pill('S-CALL', trade.shortCallStrike, near(trade.shortCallStrike))}
          {pill('L-CALL', trade.longCallStrike,  near(trade.longCallStrike))}
        </div>
      );

    case 'covered_call':
      return <div className="flex gap-1">{pill('CALL', trade.callStrike, near(trade.callStrike))}</div>;

    default:
      return null;
  }
}
