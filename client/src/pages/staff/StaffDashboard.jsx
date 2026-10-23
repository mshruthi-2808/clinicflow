import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Activity,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import { useStats } from '../../hooks/useStats.js';
import { useDoctors } from '../../hooks/useDoctors.js';
import { getKolkataDateString } from '../../utils/dateTime.js';

const todayStr = getKolkataDateString();

export default function StaffDashboard() {
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const {
    data: stats,
    isLoading: isLoadingStats,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useStats(selectedDate);

  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors({
    activeOnly: 'true',
    limit: 50,
  });

  const doctors = doctorsData?.doctors || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800 px-2.5 py-0.5 rounded-full">
            Operations Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            OPD Live Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time clinic appointments, live waiting queue metrics, and consultation throughput.
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => refetchStats()}
            disabled={isFetchingStats}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition"
            title="Refresh statistics"
            aria-label="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingStats ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isStatsError ? (
        <div className="p-6 bg-rose-950/50 border border-rose-800 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-300">
            {statsError?.message || 'Failed to load clinic statistics.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Appointments */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-black text-white">
              {isLoadingStats ? '—' : stats?.totalAppointments ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Registered bookings</p>
          </div>

          {/* Waiting in Queue */}
          <div className="bg-slate-900 border border-amber-900/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-bold uppercase tracking-wider">Waiting</span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-400">
              {isLoadingStats ? '—' : stats?.waiting ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Checked-in & awaiting</p>
          </div>

          {/* In Consultation */}
          <div className="bg-slate-900 border border-purple-900/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active</span>
              <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-purple-400">
              {isLoadingStats ? '—' : stats?.inConsultation ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Inside doctor rooms</p>
          </div>

          {/* Completed */}
          <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {isLoadingStats ? '—' : stats?.completed ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Consultations finished</p>
          </div>

          {/* Cancelled / No-show */}
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 space-y-3 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-bold uppercase tracking-wider">Cancelled</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-400">
              {isLoadingStats ? '—' : (stats?.cancelled ?? 0) + (stats?.noShow ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400">
              Cancelled: {stats?.cancelled ?? 0} • No-Show: {stats?.noShow ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Mini Today's Queue Overview by Doctor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <span>Today's Live Queue by Doctor</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a doctor to manage their consultation line and call next patients.
            </p>
          </div>

          <Link
            to="/staff/queue"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition"
          >
            <span>Open Queue Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingDoctors ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/80 rounded-xl" />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No active doctors found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              const specName = doc.specialisation?.name || 'General OPD';

              return (
                <div
                  key={doc.id}
                  className="bg-slate-950/70 border border-slate-800/80 hover:border-teal-700/80 rounded-xl p-4 flex flex-col justify-between space-y-4 transition group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
                        {doc.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-800 px-2 py-0.5 rounded-full">
                        {specName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{doc.consultationMinutes} min consults • Weekly OPD</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">OPD Line</span>
                    <Link
                      to={`/staff/queue?doctorId=${doc.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-400 hover:text-white transition"
                    >
                      <span>Manage Queue</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/staff/appointments"
          className="bg-slate-900 border border-slate-800 hover:border-teal-600 rounded-2xl p-5 space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Appointments & Check-In</h3>
          <p className="text-xs text-slate-400">
            Search scheduled visits, assign arrival tokens, and filter by status.
          </p>
        </Link>

        <Link
          to="/staff/queue"
          className="bg-slate-900 border border-slate-800 hover:border-teal-600 rounded-2xl p-5 space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Live OPD Queue Console</h3>
          <p className="text-xs text-slate-400">
            Call next patient, complete consultations, and skip no-shows.
          </p>
        </Link>

        <Link
          to="/staff/doctors"
          className="bg-slate-900 border border-slate-800 hover:border-teal-600 rounded-2xl p-5 space-y-2 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition">
            <Stethoscope className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Doctors & OPD Schedules</h3>
          <p className="text-xs text-slate-400">
            Add doctors, edit consultation timings, and manage specialisations.
          </p>
        </Link>
      </div>
    </div>
  );
}
