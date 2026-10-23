import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Stethoscope,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-teal-500 text-slate-950 shadow-sm font-bold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  const navItems = [
    { label: 'Dashboard', path: '/staff', icon: LayoutDashboard, end: true },
    { label: 'Live Queue', path: '/staff/queue', icon: Activity, end: false },
    { label: 'Appointments', path: '/staff/appointments', icon: Calendar, end: false },
    { label: 'Doctors & OPD', path: '/staff/doctors', icon: Stethoscope, end: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-white">ClinicFlow Staff</span>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Brand */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">
                Clinic<span className="text-teal-400">Flow</span>
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-teal-400">
                Staff Console (Demo)
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5" aria-label="Staff navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={navLinkClasses}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User details and actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name[0] : 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Staff User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'staff@clinicflow.local'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 flex flex-col">
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
