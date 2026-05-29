import { getStrategy, BADGE_COLORS } from '../utils/strategies';

export default function StrategyBadge({ strategyId }) {
  const s = getStrategy(strategyId);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${BADGE_COLORS[s.color]}`}>
      {s.abbr}
    </span>
  );
}
