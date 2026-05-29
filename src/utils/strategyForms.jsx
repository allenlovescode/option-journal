// Shared form field definitions used by TradeFormModal and RollTradeModal
import ExpirationPicker from '../components/ExpirationPicker';

export const DEFAULTS = {
  cash_secured_put:   { symbol: '', expiration: '', strike: '', credit: '', quantity: 1, notes: '' },
  put_credit_spread:  { symbol: '', expiration: '', shortStrike: '', longStrike: '', netCredit: '', quantity: 1, notes: '' },
  call_credit_spread: { symbol: '', expiration: '', shortStrike: '', longStrike: '', netCredit: '', quantity: 1, notes: '' },
  iron_condor:        { symbol: '', expiration: '', longPutStrike: '', shortPutStrike: '', shortCallStrike: '', longCallStrike: '', netCredit: '', quantity: 1, notes: '' },
  jade_lizard:        { symbol: '', expiration: '', shortPutStrike: '', shortCallStrike: '', longCallStrike: '', netCredit: '', quantity: 1, notes: '' },
  covered_call:       { symbol: '', expiration: '', callStrike: '', callPremium: '', sharesCostBasis: '', quantity: 1, notes: '' },
};

export function validate(strategy, f) {
  const base = f.symbol && f.expiration && f.quantity > 0;
  switch (strategy) {
    case 'cash_secured_put':   return base && f.strike > 0 && f.credit >= 0;
    case 'put_credit_spread':  return base && f.shortStrike > f.longStrike && f.netCredit >= 0;
    case 'call_credit_spread': return base && f.longStrike > f.shortStrike && f.netCredit >= 0;
    case 'iron_condor':        return base && f.longPutStrike < f.shortPutStrike && f.shortPutStrike < f.shortCallStrike && f.shortCallStrike < f.longCallStrike && f.netCredit >= 0;
    case 'jade_lizard':        return base && f.shortPutStrike > 0 && f.shortCallStrike < f.longCallStrike && f.netCredit >= 0;
    case 'covered_call':       return base && f.callStrike > 0 && f.callPremium >= 0;
    default: return false;
  }
}

function Field({ label, helper, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {children}
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, min, step }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      min={min} step={step}
      className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  );
}

const num = (v) => (v === '' ? '' : Number(v));

export const STRATEGY_FORMS = {
  cash_secured_put: ({ f, set, lockSymbol }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol" helper="e.g. SPY, AAPL">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="SPY" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Short Put Strike" helper="Sell this put">
          <Input type="number" value={f.strike} onChange={e => set({ strike: num(e.target.value) })} placeholder="450" step="0.5" />
        </Field>
        <Field label="Premium Received" helper="Per share">
          <Input type="number" value={f.credit} onChange={e => set({ credit: num(e.target.value) })} placeholder="2.50" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
    </>
  ),

  put_credit_spread: ({ f, set }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="SPY" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Short Put Strike" helper="Sell (higher)">
          <Input type="number" value={f.shortStrike} onChange={e => set({ shortStrike: num(e.target.value) })} placeholder="450" step="0.5" />
        </Field>
        <Field label="Long Put Strike" helper="Buy (lower)">
          <Input type="number" value={f.longStrike} onChange={e => set({ longStrike: num(e.target.value) })} placeholder="445" step="0.5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Net Credit" helper="Per share">
          <Input type="number" value={f.netCredit} onChange={e => set({ netCredit: num(e.target.value) })} placeholder="1.50" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
    </>
  ),

  call_credit_spread: ({ f, set }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="SPY" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Short Call Strike" helper="Sell (lower)">
          <Input type="number" value={f.shortStrike} onChange={e => set({ shortStrike: num(e.target.value) })} placeholder="460" step="0.5" />
        </Field>
        <Field label="Long Call Strike" helper="Buy (higher)">
          <Input type="number" value={f.longStrike} onChange={e => set({ longStrike: num(e.target.value) })} placeholder="465" step="0.5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Net Credit" helper="Per share">
          <Input type="number" value={f.netCredit} onChange={e => set({ netCredit: num(e.target.value) })} placeholder="1.00" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
    </>
  ),

  iron_condor: ({ f, set }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="SPY" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <p className="text-xs text-gray-500">Put wing (lower) → Call wing (upper)</p>
      <div className="grid grid-cols-4 gap-3">
        <Field label="Long Put" helper="Buy">
          <Input type="number" value={f.longPutStrike} onChange={e => set({ longPutStrike: num(e.target.value) })} placeholder="440" step="0.5" />
        </Field>
        <Field label="Short Put" helper="Sell">
          <Input type="number" value={f.shortPutStrike} onChange={e => set({ shortPutStrike: num(e.target.value) })} placeholder="445" step="0.5" />
        </Field>
        <Field label="Short Call" helper="Sell">
          <Input type="number" value={f.shortCallStrike} onChange={e => set({ shortCallStrike: num(e.target.value) })} placeholder="460" step="0.5" />
        </Field>
        <Field label="Long Call" helper="Buy">
          <Input type="number" value={f.longCallStrike} onChange={e => set({ longCallStrike: num(e.target.value) })} placeholder="465" step="0.5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Net Credit" helper="Total per share">
          <Input type="number" value={f.netCredit} onChange={e => set({ netCredit: num(e.target.value) })} placeholder="2.00" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
    </>
  ),

  jade_lizard: ({ f, set }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="SPY" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Short Put Strike" helper="Sell OTM put">
          <Input type="number" value={f.shortPutStrike} onChange={e => set({ shortPutStrike: num(e.target.value) })} placeholder="445" step="0.5" />
        </Field>
        <Field label="Short Call Strike" helper="Sell OTM call">
          <Input type="number" value={f.shortCallStrike} onChange={e => set({ shortCallStrike: num(e.target.value) })} placeholder="460" step="0.5" />
        </Field>
        <Field label="Long Call Strike" helper="Buy OTM call">
          <Input type="number" value={f.longCallStrike} onChange={e => set({ longCallStrike: num(e.target.value) })} placeholder="465" step="0.5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Net Credit" helper="Total per share">
          <Input type="number" value={f.netCredit} onChange={e => set({ netCredit: num(e.target.value) })} placeholder="3.00" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
    </>
  ),

  covered_call: ({ f, set }) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Symbol">
          <Input value={f.symbol} onChange={e => set({ symbol: e.target.value.toUpperCase() })} placeholder="AAPL" />
        </Field>
        <Field label="Expiration">
          <ExpirationPicker value={f.expiration} onChange={iso => set({ expiration: iso })} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Call Strike" helper="Sell this call">
          <Input type="number" value={f.callStrike} onChange={e => set({ callStrike: num(e.target.value) })} placeholder="190" step="0.5" />
        </Field>
        <Field label="Call Premium" helper="Credit per share">
          <Input type="number" value={f.callPremium} onChange={e => set({ callPremium: num(e.target.value) })} placeholder="1.50" step="0.01" min="0" />
        </Field>
        <Field label="Contracts">
          <Input type="number" value={f.quantity} onChange={e => set({ quantity: num(e.target.value) })} placeholder="1" min="1" />
        </Field>
      </div>
      <Field label="Shares Cost Basis" helper="Your average cost per share">
        <Input type="number" value={f.sharesCostBasis} onChange={e => set({ sharesCostBasis: num(e.target.value) })} placeholder="180.00" step="0.01" min="0" />
      </Field>
    </>
  ),
};
