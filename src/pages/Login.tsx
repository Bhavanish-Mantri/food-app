import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { ChefHat, Mail, Lock, User, ArrowRight, Globe, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant' | 'driver'>('customer');
  const [diet, setDiet] = useState<'none' | 'vegan' | 'gluten-free' | 'keto' | 'low-carb'>('none');
  const [calories, setCalories] = useState(2000);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: err } = await signIn(email);
        if (err) {
          setError(err.message || 'Login failed.');
        } else {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .single();
          if (profile?.role === 'restaurant') {
            navigate('/restaurant-dashboard');
          } else if (profile?.role === 'driver') {
            navigate('/driver-dashboard');
          } else {
            navigate('/');
          }
        }
      } else {
        const { error: err } = await signUp(email, name, role, {
          diet,
          targetCalories: Number(calories),
          allergies: []
        });
        if (err) {
          setError(err.message || 'Registration failed.');
        } else {
          if (role === 'restaurant') {
            navigate('/restaurant-dashboard');
          } else if (role === 'driver') {
            navigate('/driver-dashboard');
          } else {
            navigate('/');
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleType: 'customer' | 'restaurant' | 'driver') => {
    setLoading(true);
    setError(null);
    const emails = {
      customer: 'customer@nourish.now',
      restaurant: 'chef@nourish.now',
      driver: 'driver@nourish.now'
    };

    try {
      const { error: err } = await signIn(emails[roleType]);
      if (err) {
        setError(err.message);
      } else {
        if (roleType === 'restaurant') {
          navigate('/restaurant-dashboard');
        } else if (roleType === 'driver') {
          navigate('/driver-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google sign in
    setLoading(true);
    setTimeout(() => {
      signUp('google.user@gmail.com', 'Google User', 'customer');
      setLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 gradient-bg">
      <div className="w-full max-w-md bg-white/80 dark:bg-dark-surface/85 backdrop-blur-xl border border-neutral-200/50 dark:border-dark-border p-8 rounded-3xl shadow-2xl space-y-6 animate-slide-up">
        
        {/* Brand Logo Header */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/10 mb-4 animate-float">
            <ChefHat size={32} />
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-neutral-800 dark:text-white">
            {isLogin ? 'Welcome back to NourishNow' : 'Create your NourishNow account'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1.5">
            AI-driven nutrition and food delivery, customized for your goals.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-100 dark:bg-dark-bg/80 border border-neutral-200/10">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              isLogin 
                ? 'bg-white dark:bg-dark-surface text-brand-500 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              !isLogin 
                ? 'bg-white dark:bg-dark-surface text-brand-500 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Quick Demo logins */}
        {isLogin && (
          <div className="space-y-2.5">
            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">Quick Demo Login</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('customer')}
                className="py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-brand-500 transition-all text-center flex flex-col items-center bg-white/50 dark:bg-dark-surface/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] font-bold text-neutral-800 dark:text-white leading-none">Customer</span>
                <span className="text-[8px] text-neutral-400 mt-1">Alex Healthy</span>
              </button>
              <button
                onClick={() => handleQuickLogin('restaurant')}
                className="py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-brand-500 transition-all text-center flex flex-col items-center bg-white/50 dark:bg-dark-surface/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] font-bold text-neutral-800 dark:text-white leading-none">Chef</span>
                <span className="text-[8px] text-neutral-400 mt-1">Isabella</span>
              </button>
              <button
                onClick={() => handleQuickLogin('driver')}
                className="py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-brand-500 transition-all text-center flex flex-col items-center bg-white/50 dark:bg-dark-surface/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] font-bold text-neutral-800 dark:text-white leading-none">Driver</span>
                <span className="text-[8px] text-neutral-400 mt-1">Swift Rider</span>
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div></div>
          <span className="relative px-3 text-[10px] font-bold bg-white dark:bg-dark-surface text-neutral-400 uppercase tracking-wider">Or Email credentials</span>
        </div>

        {/* Errors */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Your Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400"><User size={14} /></span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 pl-9 pr-4 py-2.5 outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400"><Mail size={14} /></span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 pl-9 pr-4 py-2.5 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Registration Diet Preferences */}
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Select Portal Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['customer', 'restaurant', 'driver'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        role === r 
                          ? 'border-brand-500 bg-brand-500/5 text-brand-500 font-bold' 
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {role === 'customer' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl border border-brand-500/10 bg-brand-500/[0.02] dark:bg-brand-500/[0.01] animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Dietary Target</label>
                    <select
                      value={diet}
                      onChange={(e) => setDiet(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-2 py-1.5 outline-none focus:border-brand-500"
                    >
                      <option value="none">Standard</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                      <option value="low-carb">Low Carb</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Daily Calories</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-2 py-1.5 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/15 flex items-center justify-center space-x-1.5 hover:scale-[1.01] transition-all disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In Credentials' : 'Create Account'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Google Authentication Button */}
        <div className="space-y-3 pt-3 border-t border-neutral-200/50 dark:border-neutral-800/60">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:scale-[1.01] transition-all bg-white dark:bg-dark-surface"
          >
            <Globe size={14} className="text-red-500" />
            <span>Continue with Google</span>
          </button>
        </div>

      </div>
    </div>
  );
};
