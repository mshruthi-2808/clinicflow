import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function StaffLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 antialiased">
      <header className="bg-slate-800/80 border-b border-slate-700/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">ClinicFlow Staff</span>
              <span className="ml-2 text-xs font-mono text-teal-300 bg-teal-950/70 border border-teal-800 px-2 py-0.5 rounded-full">
                Phase 5 Console
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Patient Portal</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
