import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  Phone,
  AlertCircle,
  RefreshCw,
  FastForward,
  Check,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  useDoctorQueue,
  useCallNext,
  useCompleteQueueEntry,
  useSkipQueueEntry,
} from '../../hooks/useQueue.js';
import { useDoctors } from '../../hooks/useDoctors.js';
import StatusBadge from '../../components/StatusBadge.jsx';

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDateString();

export default function StaffQueue() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors({
    activeOnly: 'true',
    limit: 50,
  });

  const doctors = doctorsData?.doctors || [];

  // Selected doctor: from search param or first doctor in list
  const doctorIdParam = searchParams.get('doctorId');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorIdParam || '');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    if (doctorIdParam && doctors.some((d) => d.id === doctorIdParam)) {
      if (selectedDoctorId !== doctorIdParam) {
        setSelectedDoctorId(doctorIdParam);
      }
    } else if (!selectedDoctorId && doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, doctorIdParam, selectedDoctorId]);

  const handleDoctorChange = (id) => {
    setSelectedDoctorId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('doctorId', id);
      return next;
    });
  };

  // Fetch live doctor queue
  const {
    data: queueData,
    isLoading: isLoadingQueue,
    isError: isQueueError,
    error: queueError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useDoctorQueue(selectedDoctorId, selectedDate);

  const callNextMutation = useCallNext();
  const completeMutation = useCompleteQueueEntry();
  const skipMutation = useSkipQueueEntry(selectedDoctorId, selectedDate);

  const entries = queueData?.entries || [];
  const doctor = queueData?.doctor;

  // Active in consultation entry
  const activeConsultation = entries.find((e) => e.status === 'IN_CONSULTATION');

  // Waiting patients sorted by token/position
  const waitingEntries = entries.filter((e) => e.status === 'WAITING');

  // Past / processed entries (COMPLETED, SKIPPED)
  const historyEntries = entries.filter((e) => e.status === 'COMPLETED' || e.status === 'SKIPPED');

  const canCallNext = !activeConsultation && waitingEntries.length > 0;

  const handleCallNext = async () => {
    if (!canCallNext || !selectedDoctorId) return;
    try {
      await callNextMutation.mutateAsync(selectedDoctorId);
    } catch {
      // Toast already handled by mutation hook
    }
  };

  const handleComplete = async (entryId) => {
    if (!entryId) return;
    try {
      await completeMutation.mutateAsync(entryId);
    } catch {
      // Toast handled by mutation hook
    }
  };

  const handleSkip = async (entryId) => {
    if (!entryId) return;
    try {
      await skipMutation.mutateAsync(entryId);
    } catch {
      // Toast handled by mutation hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800 px-2.5 py-0.5 rounded-full">
            OPD Console
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Live Consultation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time patient flow: call next in line, complete ongoing consults, or skip no-shows.
          </p>
        </div>

        {/* Live sync pulse & manual refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            <span>Live Polling (5s)</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Refresh queue now"
            aria-label="Refresh queue now"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Doctor & Date Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Doctor select */}
          <div className="relative flex-1">
            <label htmlFor="doctor-queue-select" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Doctor
            </label>
            <div className="relative">
              <select
                id="doctor-queue-select"
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                disabled={isLoadingDoctors}
                className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialisation?.name || 'General OPD'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date select */}
          <div>
            <label htmlFor="queue-date-picker" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Queue Date
            </label>
            <input
              id="queue-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Primary Action: Call Next Patient */}
        <div className="pt-2 md:pt-5">
          <button
            type="button"
            onClick={handleCallNext}
            disabled={!canCallNext || callNextMutation.isPending}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition ${
              canCallNext
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title={
              activeConsultation
                ? 'Complete the ongoing consultation first'
                : waitingEntries.length === 0
                ? 'No patients waiting in queue'
                : 'Call the next waiting patient into room'
            }
          >
            {callNextMutation.isPending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <FastForward className="w-4 h-4" />
                <span>Call Next Patient</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Active Consultation + Waiting Queue */}
      {isQueueError ? (
        <div className="p-8 bg-rose-950/60 border border-rose-800 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-300">
            {queueError?.message || 'Could not load live queue.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Consultation Spotlight */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Doctor's Room Status
              </span>
              <StatusBadge status={activeConsultation ? 'IN_CONSULTATION' : 'COMPLETED'} size="sm" />
            </div>

            {activeConsultation ? (
              <div className="space-y-5">
                <div className="text-center py-2 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                    Currently In Consultation
                  </span>
                  <div className="w-20 h-20 rounded-2xl bg-purple-600 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-lg ring-4 ring-purple-900/50">
                    #{activeConsultation.tokenNumber}
                  </div>
                  <h3 className="text-lg font-bold text-white pt-1">
                    {activeConsultation.patientName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {activeConsultation.patientPhone}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Slot:</span>
                    <span className="font-semibold text-white">{activeConsultation.slotStart}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Called at:</span>
                    <span className="font-semibold text-white">
                      {activeConsultation.calledAt
                        ? new Date(activeConsultation.calledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleComplete(activeConsultation.queueEntryId || activeConsultation.id)}
                  disabled={completeMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
                >
                  {completeMutation.isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Completing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Complete Consultation</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">Room is Available</h4>
                  <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                    {waitingEntries.length > 0
                      ? 'Click "Call Next Patient" to bring in the next token.'
                      : 'No waiting patients currently in the OPD line.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Waiting Patients Line */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Waiting in Queue</h3>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                  {waitingEntries.length} waiting
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Ordered by arrival token</span>
            </div>

            {waitingEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="font-semibold text-slate-400">No patients waiting in queue</p>
                <p className="text-[11px]">
                  When booked appointments arrive, check them in from the Appointments tab to issue live tokens.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {waitingEntries.map((entry, index) => {
                  return (
                    <div
                      key={entry.queueEntryId || entry.tokenNumber}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center flex-shrink-0 shadow-2xs">
                          #{entry.tokenNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{entry.patientName}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                              Slot: {entry.slotStart}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Pos: #{entry.position || index + 1}</span>
                            <span>•</span>
                            <span>Est: ~{entry.estimatedWaitMinutes || 0}m</span>
                            <span>•</span>
                            <span className="font-mono">{entry.patientPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleSkip(entry.queueEntryId || entry.id)}
                          disabled={skipMutation.isPending}
                          className="px-3 py-1 bg-slate-800 hover:bg-zinc-800 border border-slate-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs font-semibold transition"
                          title="Skip this patient (marked as no-show)"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed & Skipped History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">Consultation Queue History</h3>
          <span className="text-xs text-slate-400 font-medium">
            {historyEntries.length} completed / skipped
          </span>
        </div>

        {historyEntries.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No consultations have concluded yet today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Completed / Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyEntries.map((entry) => (
                  <tr key={entry.queueEntryId || entry.tokenNumber} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-300">
                      #{entry.tokenNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">{entry.patientName}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{entry.slotStart}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={entry.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                      {entry.completedAt
                        ? new Date(entry.completedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
