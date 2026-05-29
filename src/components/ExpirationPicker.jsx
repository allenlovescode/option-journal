import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, Check } from 'lucide-react';
import { generateExpirations, dteBg } from '../utils/expirations';

export default function ExpirationPicker({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const containerRef        = useRef(null);
  const listRef             = useRef(null);

  const expirations = useMemo(() => generateExpirations(52), []);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map();
    expirations.forEach((e) => {
      if (!map.has(e.month)) map.set(e.month, []);
      map.get(e.month).push(e);
    });
    return map;
  }, [expirations]);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Scroll selected item into view when opening
  useEffect(() => {
    if (open && value && listRef.current) {
      const el = listRef.current.querySelector('[data-selected="true"]');
      el?.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const selected = expirations.find((e) => e.iso === value);

  const handleSelect = (iso) => {
    onChange(iso);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded border text-sm transition-all
          ${open
            ? 'bg-gray-800 border-blue-500 ring-1 ring-blue-500'
            : 'bg-gray-800 border-gray-600 hover:border-gray-400'}`}
      >
        <span className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-500 flex-shrink-0" />
          {selected ? (
            <span className="text-white font-medium">
              {selected.label}
              <span className={`ml-2 text-xs font-normal ${dteBg(selected.dte).split(' ')[2]}`}>
                · {selected.dte}d
              </span>
            </span>
          ) : (
            <span className="text-gray-500">Select expiration…</span>
          )}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
          {/* Search / filter */}
          <div className="p-2 border-b border-gray-800">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by month or date…"
              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* List */}
          <div ref={listRef} className="overflow-y-auto max-h-64 scrollbar-thin">
            {[...grouped.entries()].map(([month, dates]) => {
              const filtered = search
                ? dates.filter((d) =>
                    d.label.toLowerCase().includes(search.toLowerCase()) ||
                    d.month.toLowerCase().includes(search.toLowerCase())
                  )
                : dates;
              if (!filtered.length) return null;

              return (
                <div key={month}>
                  {/* Month header */}
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 bg-gray-800/60 sticky top-0">
                    {month}
                  </div>

                  {filtered.map((exp) => {
                    const isSelected = exp.iso === value;
                    return (
                      <button
                        key={exp.iso}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelect(exp.iso)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-800
                          ${isSelected ? 'bg-blue-900/30' : ''}`}
                      >
                        {/* Date */}
                        <div className="flex items-center gap-2">
                          {isSelected
                            ? <Check size={13} className="text-blue-400 flex-shrink-0" />
                            : <span className="w-[13px] flex-shrink-0" />
                          }
                          <span className={isSelected ? 'text-white font-medium' : 'text-gray-200'}>
                            {exp.label.replace(`, ${exp.year}`, '')}
                          </span>
                          {exp.monthly && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-blue-900/40 border-blue-700 text-blue-300 font-semibold">
                              Monthly
                            </span>
                          )}
                        </div>

                        {/* DTE badge */}
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${dteBg(exp.dte)}`}>
                          {exp.dte}d
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-gray-800 text-[10px] text-gray-600 flex gap-4">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-400" /> &gt;45d</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" /> 21–45d</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-orange-400" /> 7–21d</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-400" /> &lt;7d</span>
            <span className="ml-auto">Excludes weekends &amp; holidays</span>
          </div>
        </div>
      )}
    </div>
  );
}
