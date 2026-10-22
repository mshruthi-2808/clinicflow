import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffLogin() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/staff';

  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already logged in, redirect to staff area
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/staff', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      await login(data.email.trim(), data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'staff@clinicflow.local');
    setValue('password', 'ClinicStaff123!');
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Top return link */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to ClinicFlow Patient Portal</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Staff Management Portal</h1>
          <p className="text-xs text-slate-400">
            Sign in with administrative credentials to access OPD queue consoles and records.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          {loginError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{loginError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="staff-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  placeholder="staff@clinicflow.local"
                  {...register('email', {
                    required: 'Staff email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs font-semibold text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="staff-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="staff-password"
                  type="password"
                  placeholder="••••••••••••"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs font-semibold text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-slate-950 font-bold text-sm rounded-xl transition shadow-md"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Staff Console</span>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials Auto-Fill Box */}
          <div className="pt-4 border-t border-slate-700/80">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-900/80 hover:bg-slate-900 border border-teal-800/80 hover:border-teal-600 rounded-xl text-xs font-semibold text-teal-300 transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Auto-Fill Demo Credentials (staff@clinicflow.local)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
