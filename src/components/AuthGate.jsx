import { useState, useEffect } from 'react';
import { BookOpen, Mail, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthGate({ children }) {
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (magic link click, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email) return;
    setSending(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setSending(false);
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

          {!sent ? (
            <>
              <p className="text-sm text-gray-300 mb-5">
                Sign in with your email — we'll send you a magic link, no password needed.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                  onClick={handleLogin}
                  disabled={!email || sending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {sending ? (
                    <>Sending…</>
                  ) : (
                    <><LogIn size={15} /> Send Magic Link</>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-4 text-center">
                First time? An account is created automatically.
              </p>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-900/40 border border-green-700 flex items-center justify-center mx-auto">
                <Mail size={20} className="text-green-400" />
              </div>
              <p className="text-white font-semibold">Check your email</p>
              <p className="text-gray-400 text-sm">
                We sent a sign-in link to <span className="text-blue-300">{email}</span>.<br />
                Click it to open the app.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}
