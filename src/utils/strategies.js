export const STRATEGIES = [
  { id: 'cash_secured_put',  label: 'Cash Secured Put',   abbr: 'CSP', color: 'indigo' },
  { id: 'put_credit_spread', label: 'Put Credit Spread',  abbr: 'PCS', color: 'blue'   },
  { id: 'call_credit_spread',label: 'Call Credit Spread', abbr: 'CCS', color: 'violet' },
  { id: 'iron_condor',       label: 'Iron Condor',        abbr: 'IC',  color: 'emerald'},
  { id: 'jade_lizard',       label: 'Jade Lizard',        abbr: 'JL',  color: 'teal'  },
  { id: 'covered_call',      label: 'Covered Call',       abbr: 'CC',  color: 'amber' },
];

export const getStrategy = (id) => STRATEGIES.find((s) => s.id === id) ?? STRATEGIES[0];

export const BADGE_COLORS = {
  indigo:  'bg-indigo-900/60 text-indigo-300 border-indigo-700',
  blue:    'bg-blue-900/60   text-blue-300   border-blue-700',
  violet:  'bg-violet-900/60 text-violet-300 border-violet-700',
  emerald: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  teal:    'bg-teal-900/60   text-teal-300   border-teal-700',
  amber:   'bg-amber-900/60  text-amber-300  border-amber-700',
};
