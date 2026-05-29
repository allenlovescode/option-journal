import { differenceInCalendarDays, parseISO, format } from 'date-fns';

export const fmt$ = (n, decimals = 2) =>
  n == null ? '—' : `$${Math.abs(n).toFixed(decimals)}`;

export const fmtPnl = (n) => {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
};

export const fmtDate = (iso) => (iso ? format(parseISO(iso), 'MMM d, yyyy') : '—');

export const dte = (expiration) => {
  if (!expiration) return null;
  const days = differenceInCalendarDays(parseISO(expiration), new Date());
  return days;
};

export const dteLabel = (expiration) => {
  const d = dte(expiration);
  if (d == null) return '—';
  if (d < 0) return 'Expired';
  if (d === 0) return 'Expires today';
  return `${d}d`;
};

export const pnlColor = (n) => {
  if (n == null) return 'text-gray-400';
  if (n > 0) return 'text-green-400';
  if (n < 0) return 'text-red-400';
  return 'text-gray-300';
};
