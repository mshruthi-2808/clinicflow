import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';
import { useQueueTracking } from '../hooks/useQueue.js';
import { useAppointment } from '../hooks/useAppointments.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function QueueTracking() {
  const { appointmentId } = useParams();

  const {
    data: queueData,
    isLoading: isLoadingQueue,
    isError: isQueueError,
    error: queueError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQueueTracking(appointmentId);

  const { data: appointment, isLoading: isLoadingApt } = useAppointment(appointmentId);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  const isLoading = isLoadingQueue || isLoadingApt;

  if (isLoading) {
    return (
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (isQueueError || !appointment) {
    return (
      <div className="flex-1 max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Queue Record Not Found</h2>
        <p className="text-sm text-slate-600">
          {queueError?.message || 'We could not find an appointment queue matching this identifier.'}
        </p>
        <Link
          to="/my-appointments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Appointments</span>
        </Link>
      </div>
    );
  }

  const status = queueData?.status || appointment.status;
  const tokenNumber = queueData?.token;
  const position = queueData?.position;
  const patientsAhead = queueData?.patientsAhead ?? 0;
  const estimatedWait = queueData?.estimatedWaitMinutes ?? 0;
  const disclaimer = queueData?.disclaimer;

  const doctorName = appointment.doctor?.name || 'Assigned Doctor';
  const specName = appointment.doctor?.specialisation?.name || 'General OPD';
  const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Top back navigation and live status */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-appointments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Appointments</span>
        </Link>

        {/* Live sync pulse */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          <span>
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 text-slate-400 hover:text-teal-600 rounded transition"
            title="Refresh now"
            aria-label="Refresh queue status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Appointment & Doctor Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{doctorName}</h1>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {specName}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Patient: <span className="font-semibold text-slate-800">{appointment.patientName}</span> • Slot:{' '}
              <span className="font-semibold text-slate-800">{appointment.slotStart}</span> ({appointmentDate})
            </p>
          </div>
        </div>

        <div>
          <StatusBadge status={status} size="md" />
        </div>
      </div>

      {/* STATUS BANNER */}
      {status === 'BOOKED' && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-sky-950">Appointment Booked — Not Checked In Yet</h2>
            <p className="text-xs text-sky-800 max-w-md mx-auto leading-relaxed">
              When you arrive at the clinic on your appointment day, please present your Appointment ID or phone number at the front desk reception. Staff will check you in and issue your live queue token.
            </p>
          </div>
          <div className="inline-block bg-white border border-sky-200 rounded-xl px-4 py-2 text-xs font-mono font-semibold text-sky-900">
            Appointment ID: {appointment.id}
          </div>
        </div>
      )}

      {status === 'WAITING' && (
        <div className="bg-gradient-to-b from-amber-50/90 to-white border border-amber-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <span>Live OPD Waiting Queue</span>
          </div>

          {/* Prominent Token Display */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Your Token Number</p>
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-amber-500 text-white font-extrabold text-5xl shadow-md ring-8 ring-amber-100">
              #{tokenNumber}
            </div>
          </div>

          {/* Position & Wait Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-2">
            {/* Position indicator */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Queue Position
              </span>
              <div className="text-2xl font-black text-slate-900">
                {position ? `#${position}` : '—'}
              </div>
              <p className="text-xs text-slate-600">
                {patientsAhead === 0 ? 'You are next in line!' : `${patientsAhead} patient${patientsAhead > 1 ? 's' : ''} ahead`}
              </p>
            </div>

            {/* Estimated Wait */}
            <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-2xs space-y-1">
              <div className="flex items-center justify-center gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Estimated Wait
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                  Estimated
                </span>
              </div>
              <div className="text-2xl font-black text-teal-700">
                ~{estimatedWait} mins
              </div>
              <p className="text-xs text-slate-600 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Updated in real time</span>
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          {disclaimer && (
            <p className="text-xs text-slate-600 max-w-md mx-auto pt-2 leading-relaxed">
              ⓘ {disclaimer}
            </p>
          )}
        </div>
      )}

      {status === 'IN_CONSULTATION' && (
        <div className="bg-gradient-to-b from-purple-50 to-white border-2 border-purple-400 rounded-2xl p-6 sm:p-10 shadow-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider animate-pulse">
              ● It's Your Turn
            </div>
            <h2 className="text-3xl font-extrabold text-slate-950">In Consultation Now</h2>
            <p className="text-sm font-semibold text-purple-900 max-w-md mx-auto">
              Token #{tokenNumber}: Please proceed into {doctorName}'s consultation room.
            </p>
          </div>

          <div className="bg-purple-100/60 border border-purple-200 rounded-xl p-4 text-xs text-purple-950 max-w-md mx-auto">
            Doctor consultation is currently in progress. Please have your prescriptions and records ready.
          </div>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-emerald-950">Consultation Completed</h2>
            <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
              Your consultation for Token #{tokenNumber} with {doctorName} has concluded. Thank you for visiting ClinicFlow!
            </p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition"
          >
            <span>Book Next Visit</span>
          </Link>
        </div>
      )}

      {status === 'SKIPPED' && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-200 text-zinc-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-zinc-900">Token Skipped (No-Show)</h2>
            <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
              Token #{tokenNumber} was called by the doctor but you were not present. Please speak with the front desk reception if you need to be re-entered into the queue.
            </p>
          </div>
        </div>
      )}

      {status === 'CANCELLED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-rose-950">Appointment Cancelled</h2>
            <p className="text-xs text-rose-800 max-w-md mx-auto leading-relaxed">
              This appointment has been cancelled. No queue token is active.
            </p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <span>Book New Appointment</span>
          </Link>
        </div>
      )}
    </div>
  );
}
