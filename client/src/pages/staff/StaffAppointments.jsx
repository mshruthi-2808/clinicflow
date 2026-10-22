import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments.js';
import { useDoctors } from '../../hooks/useDoctors.js';
import { useCheckIn } from '../../hooks/useQueue.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDateString();

export default function StaffAppointments() {
  // Filters
  const [dateFilter, setDateFilter] = useState(todayStr);
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [sortField, setSortField] = useState('slotStart');
  const [sortOrder, setSortOrder] = useState('asc');

  // Confirmation modal for cancelling appointment
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 350);

  // Doctors for filter dropdown
  const { data: doctorsData } = useDoctors({ limit: 50 });
  const doctors = doctorsData?.doctors || [];

  // Query appointments
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAppointments({
    date: dateFilter || undefined,
    doctorId: doctorFilter || undefined,
    status: statusFilter || undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    limit,
    sort: `${sortField}:${sortOrder}`,
  });

  const checkInMutation = useCheckIn();
  const cancelMutation = useCancelAppointment();

  const appointments = appointmentsData?.appointments || [];
  const meta = appointmentsData?.meta || { total: 0, totalPages: 1 };

  const handleCheckIn = async (aptId) => {
    try {
      await checkInMutation.mutateAsync(aptId);
    } catch {
      // Toast already shown in mutation hook
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      await cancelMutation.mutateAsync(appointmentToCancel.id);
      setAppointmentToCancel(null);
    } catch {
      // Toast already shown in mutation hook
    }
  };

  const handleClearFilters = () => {
    setDateFilter('');
    setDoctorFilter('');
    setStatusFilter('');
    setSearchInput('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800 px-2.5 py-0.5 rounded-full">
            Staff Registry
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Appointment Records & Check-In
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search patient bookings, check patients into the live OPD queue, or manage cancellations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-xl transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search patient name or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">Booked</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>

        {/* Quick filter actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFilter(todayStr);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                dateFilter === todayStr
                  ? 'bg-teal-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2.5 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>

          <div className="text-slate-400 font-medium">
            Found <span className="font-bold text-white">{meta.total}</span> appointments
          </div>
        </div>
      </div>

      {/* Table Section with Horizontal Scroll for Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-rose-400">
                    {error?.message || 'Failed to load appointments.'}
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-slate-400 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No appointments found</p>
                    <p className="text-[11px] text-slate-500">
                      Try adjusting the date, status, or search filters above.
                    </p>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const isBooked = apt.status === 'BOOKED';
                  const isCheckedIn = apt.status === 'CHECKED_IN';
                  const isCancellable = isBooked || isCheckedIn;
                  const aptDateStr = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Slot & Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-teal-300 text-sm">{apt.slotStart}</div>
                        <div className="text-[11px] text-slate-400">{aptDateStr}</div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{apt.patientPhone}</span>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{apt.doctor?.name || '—'}</div>
                        <div className="text-[10px] text-slate-400">
                          {apt.doctor?.specialisation?.name || 'General OPD'}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-400">
                        {apt.reason || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={apt.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isBooked && (
                            <button
                              type="button"
                              onClick={() => handleCheckIn(apt.id)}
                              disabled={checkInMutation.isPending}
                              className="px-3 py-1 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-800 text-slate-950 font-bold rounded-lg text-xs transition shadow-2xs"
                            >
                              Check In
                            </button>
                          )}

                          {isCheckedIn && (
                            <span className="text-[11px] font-mono font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-lg">
                              Checked In
                            </span>
                          )}

                          {isCancellable && (
                            <button
                              type="button"
                              onClick={() => setAppointmentToCancel(apt)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition"
                              title="Cancel appointment"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing Page <span className="font-bold text-white">{meta.page || 1}</span> of{' '}
            <span className="font-bold text-white">{meta.totalPages || 1}</span> ({meta.total} total)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-300 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={page >= (meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-300 hover:text-white transition"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Cancellation */}
      <ConfirmModal
        isOpen={Boolean(appointmentToCancel)}
        title="Cancel Patient Appointment"
        message={
          appointmentToCancel
            ? `Are you sure you want to cancel the booking for ${appointmentToCancel.patientName} (${appointmentToCancel.slotStart})? This will free the slot.`
            : ''
        }
        confirmText="Yes, Cancel Booking"
        cancelText="Keep"
        confirmVariant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setAppointmentToCancel(null)}
      />
    </div>
  );
}
