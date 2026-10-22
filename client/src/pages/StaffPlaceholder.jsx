import React from 'react';
import { ArrowLeft, Activity, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800 px-3 py-1 rounded-full">
            Coming in Phase 5
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Staff & OPD Operations Portal
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            The Staff Management Console, Check-in Token Dispenser, and Live Consultation Queue Engine will be activated in Phase 5.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <Users className="w-4 h-4" />
              <span>Token Check-In</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Assign sequential tokens to booked appointments arriving at the clinic.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
              <Clock className="w-4 h-4" />
              <span>Live Queue Console</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Call-next, consult, and complete patient entries in real time.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Patient Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
