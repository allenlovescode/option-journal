import { addDays, format, parseISO, getDay, differenceInCalendarDays, startOfDay } from 'date-fns';

// NYSE market holidays 2025–2027
const HOLIDAYS = new Set([
  // 2025
  '2025-01-01','2025-01-20','2025-02-17','2025-04-18',
  '2025-05-26','2025-06-19','2025-07-04','2025-09-01',
  '2025-11-27','2025-12-25',
  // 2026
  '2026-01-01','2026-01-19','2026-02-16','2026-04-03',
  '2026-05-25','2026-06-19','2026-07-03','2026-09-07',
  '2026-11-26','2026-12-25',
  // 2027
  '2027-01-01','2027-01-18','2027-02-15','2027-03-26',
  '2027-05-31','2027-06-18','2027-07-04','2027-09-06',
  '2027-11-25','2027-12-24',
]);

function isHoliday(date) {
  return HOLIDAYS.has(format(date, 'yyyy-MM-dd'));
}

// Is this the 3rd Friday of its month? (standard monthly expiry)
function isMonthly(date) {
  if (getDay(date) !== 5) return false;
  const d = date.getDate();
  return d >= 15 && d <= 21;
}

// Move back to prior trading day if date is a holiday
function prevTradingDay(date) {
  let d = date;
  while (isHoliday(d) || getDay(d) === 0 || getDay(d) === 6) {
    d = addDays(d, -1);
  }
  return d;
}

export function generateExpirations(weeksAhead = 52) {
  const today = startOfDay(new Date());
  const results = [];

  // Find next Friday on or after tomorrow
  let cursor = addDays(today, 1);
  while (getDay(cursor) !== 5) cursor = addDays(cursor, 1);

  for (let i = 0; i < weeksAhead; i++) {
    // If Friday is a holiday, use Thursday
    let expDate = isHoliday(cursor) ? prevTradingDay(addDays(cursor, -1)) : cursor;

    const dte = differenceInCalendarDays(expDate, today);
    if (dte > 0) {
      results.push({
        iso:     format(expDate, 'yyyy-MM-dd'),
        label:   format(expDate, 'EEE MMM d, yyyy'),
        short:   format(expDate, 'MMM d'),
        dte,
        monthly: isMonthly(cursor), // use original Friday for monthly check
        year:    format(expDate, 'yyyy'),
        month:   format(expDate, 'MMMM yyyy'),
      });
    }

    cursor = addDays(cursor, 7);
  }

  return results;
}

export function dteColor(dte) {
  if (dte > 45)  return 'text-green-400';
  if (dte > 21)  return 'text-yellow-400';
  if (dte > 7)   return 'text-orange-400';
  return 'text-red-400';
}

export function dteBg(dte) {
  if (dte > 45)  return 'bg-green-900/40 border-green-700 text-green-300';
  if (dte > 21)  return 'bg-yellow-900/40 border-yellow-700 text-yellow-300';
  if (dte > 7)   return 'bg-orange-900/40 border-orange-700 text-orange-300';
  return 'bg-red-900/40 border-red-700 text-red-300';
}
