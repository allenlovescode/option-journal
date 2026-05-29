import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_MS = 60_000; // refresh every 60 s

async function fetchPrice(symbol) {
  const url = `/api/market/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No data');
  return meta.regularMarketPrice ?? meta.chartPreviousClose;
}

export function useMarketPrices(symbols) {
  const [prices, setPrices]   = useState({});
  const [loading, setLoading] = useState(false);
  const timerRef              = useRef(null);

  const refresh = useCallback(async () => {
    const unique = [...new Set(symbols.filter(Boolean))];
    if (!unique.length) return;
    setLoading(true);
    const results = await Promise.allSettled(unique.map((s) => fetchPrice(s)));
    const next = { ...prices };
    unique.forEach((sym, i) => {
      if (results[i].status === 'fulfilled') next[sym] = results[i].value;
    });
    setPrices(next);
    setLoading(false);
  }, [symbols.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [refresh]);

  return { prices, loading, refresh };
}
