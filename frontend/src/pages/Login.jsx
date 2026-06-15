import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, AlertCircle, HeartHandshake } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      // Log in without specifying a role constraint so it authenticates either role
      const authenticatedUser = await login(username, password);
      
      // Redirect based on the authenticated user's role
      if (authenticatedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-cream dark:bg-neutral-950 relative px-4">
      {/* Background Ornament */}
      <div className="absolute inset-0 bg-islamic-pattern pointer-events-none opacity-5"></div>

      {/* Top Ornament */}
      <div className="w-full bg-brand-red-dark text-center py-2 relative z-10 border-b-4 border-brand-gold shadow-sm">
        <span className="text-brand-cream text-[10px] tracking-widest font-semibold uppercase">
          ✦ Sabeel E Aliasgar Management Portal ✦
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center py-6 sm:py-12 relative z-10">
        <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 p-6 sm:p-8 animate-fade-in text-neutral-800 dark:text-neutral-200">
          
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-brand-red-medium/10 rounded-full text-brand-red-medium mb-3">
              <HeartHandshake size={32} />
            </div>
            <h2 className="text-2xl font-bold text-brand-red-dark dark:text-brand-cream font-serif">
              Sabeel E Aliasgar
            </h2>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-1 font-semibold">
              Finance & Expense Management
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-900/30 text-xs">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Failed</p>
                <p className="opacity-90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-450 dark:text-neutral-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. member_a or admin"
                  className="login-input w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-brand-green-medium transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-450 dark:text-neutral-500">
                  <KeyRound size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-brand-green-medium transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-green-medium hover:bg-brand-green-dark text-white rounded-xl font-bold shadow-md cursor-pointer hover:shadow-lg disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all text-sm mt-3"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>

      {/* Footer Branding */}
      <footer className="text-center py-4 border-t border-neutral-200/50 dark:border-neutral-850 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm z-10 text-[10px] text-neutral-400 dark:text-neutral-500">
        &copy; {new Date().getFullYear()} Sabeel E Aliasgar Management Portal. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
