import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Shield, Briefcase, GraduationCap, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e, overrideEmail, overridePassword) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = overrideEmail || email;
    const loginPassword = overridePassword || password;

    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        if (res.user.role === 'ADMIN') navigate('/dashboard/admin');
        else if (res.user.role === 'FACULTY') navigate('/dashboard/faculty');
        else navigate('/dashboard/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500/20 selection:text-emerald-300">
      
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Campus<span className="text-emerald-400 font-semibold">Hub</span>
            </span>
          </Link>
          <h2 className="text-lg font-bold text-slate-100">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400">Manage & book campus resources</p>
        </div>

        {/* ONE-CLICK DEMO LOGIN BUTTONS CARD */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            ONE-CLICK DEMO LOGINS
          </div>
          <p className="text-[11px] text-slate-400 mb-2.5">Click any account role to log in instantly:</p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleLogin(null, 'admin@campus.com', 'Admin@123')}
              className="py-2 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              ADMIN
            </button>

            <button
              onClick={() => handleLogin(null, 'faculty@campus.com', 'Faculty@123')}
              className="py-2 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" />
              FACULTY
            </button>

            <button
              onClick={() => handleLogin(null, 'student@campus.com', 'Student@123')}
              className="py-2 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex flex-col items-center gap-1 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              STUDENT
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
          
          {searchParams.get('expired') && (
            <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Session expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.com"
                  className="subtle-input w-full pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="subtle-input w-full pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="subtle-button-primary w-full py-2.5 flex items-center justify-center gap-1.5 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
              Create account
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
