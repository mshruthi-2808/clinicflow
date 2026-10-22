import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Activity, Calendar, Users, ShieldCheck, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-teal-50 text-teal-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:bg-teal-700 transition">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Clinic<span className="text-teal-600">Flow</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                OPD Care
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            <NavLink to="/doctors" className={navLinkClasses}>
              <Users className="w-4 h-4 text-teal-600" />
              <span>Find Doctors</span>
            </NavLink>

            <NavLink to="/my-appointments" className={navLinkClasses}>
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>My Appointments</span>
            </NavLink>

            <div className="h-5 w-px bg-slate-200 mx-2" aria-hidden="true" />

            <Link
              to="/staff"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="Staff & OPD Queue Management Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Staff Portal</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          <NavLink
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClasses}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Find Doctors</span>
          </NavLink>

          <NavLink
            to="/my-appointments"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClasses}
          >
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>My Appointments</span>
          </NavLink>

          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
