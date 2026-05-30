import { useState, useEffect, useRef } from 'react';
import { BookOpen, LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const OTP_LENGTH = 8;

function OtpInput({ onComplete }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    // Allow paste of full code
    if (val.length === OTP_LENGTH && /^\d+$/.test(val)) {
      const arr = val.split('');
      setDigits(arr);
      onComplete(val);
      inputs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
    if (next.every(d => d !== '')) onComplete(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-1.5 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={OTP_LENGTH}
          value={d}
          autoFocus={i === 0}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          className="w-8 text-center text-lg font-bold bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-3"
        />
      ))}
    </div>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [email, setEmail]         = useState('');
  const [step, setStep]           = useState('email');   // 'email' | 'otp'
  const [sending, setSending]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendCode = async () => {
    if (!email) return;
    setSending(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setSending(false);
  };

  const handleVerify = async (code) => {
    setVerifying(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      setError('Invalid or expired code. Try again.');
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0b0f1a' }}>
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0b0f1a' }}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-sm shadow-2xl">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BookOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Option Journal</h1>
              <p className="text-xs text-gray-500">Trading position tracker</p>
            </div>
          </div>

          {step === 'email' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCode()}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                onClick={handleSendCode}
                disabled={!email || sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {sending ? 'Sending…' : <><LogIn size={15} /> Send Code</>}
              </button>

              <p className="text-xs text-gray-600 text-center">
                First time? An account is created automatically.
              </p>
            </div>

          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Enter your code</p>
                <p className="text-gray-400 text-sm">
                  We sent an 8-digit code to<br />
                  <span className="text-blue-300">{email}</span>
                </p>
              </div>

              <OtpInput onComplete={handleVerify} />

              {verifying && (
                <p className="text-center text-xs text-gray-400">Verifying…</p>
              )}
              {error && (
                <p className="text-center text-xs text-red-400">{error}</p>
              )}

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={handleSendCode}
                  disabled={sending}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
                >
                  {sending ? 'Resending…' : 'Resend code'}
                </button>
                <button
                  onClick={() => { setStep('email'); setError(''); }}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <ArrowLeft size={11} /> Use a different email
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return children;
}
