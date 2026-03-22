import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const { user, login, hasProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(hasProfile ? '/' : '/onboarding');
    }
  }, [user, hasProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      login(response.data.access_token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center animate-fadeUp">
        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Activity className="w-7 h-7 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">CaphFit</h1>
        <p className="text-sm text-slate-500 mt-1">Track nutrition, reach your goals</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fadeUp animate-delay-1">
        <div className="card p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full mt-2"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-sm text-slate-500 animate-fadeUp animate-delay-2">
        Don't have an account?{' '}
        <Link to="/register" className="text-emerald-400 font-medium hover:text-emerald-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}
