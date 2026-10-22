import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Search,
  Calendar,
  Clock,
  User,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAppointments, useCancelAppointment } from '../hooks/useAppointments.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { AppointmentCardSkeleton } from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MyAppointments() {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [phoneInput, setPhoneInput] = useState(() => {
    return localStorage.getItem('clinicflow_patient_phone') || '';
  });
  const [activePhone, setActivePhone] = useState(() => {
    return localStorage.getItem('clinicflow_patient_phone') || '';
  });

  // Modal state for cancellation confirmation
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // Sync to local storage
  useEffect(() => {
    if (activePhone) {
      localStorage.setItem('clinicflow_patient_phone', activePhone);
    }
  }, [activePhone]);

  // Fetch appointments for active phone
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAppointments(
    { search: activePhone, limit: 50, sort: 'appointmentDate:desc' },
    { enabled: Boolean(activePhone && activePhone.length >= 10) }
  );

  const cancelMutation = useCancelAppointment();

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    const cleaned = phoneInput.trim().replace(/\D/g, '');
    if (cleaned.length < 10) {
      showErrorToast('Please enter a valid 10-digit phone number');
      return;
    }
    setActivePhone(cleaned);
  };

  const handleClearPhone = () => {
    setPhoneInput('');
    setActivePhone('');
    localStorage.removeItem('clinicflow_patient_phone');
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;

    try {
      await cancelMutation.mutateAsync(appointmentToCancel.id);
      showSuccessToast('Appointment successfully cancelled');
      setAppointmentToCancel(null);
    } catch (err) {
      showErrorToast(err.message || 'Failed to cancel appointment');
    }
  };

  const allAppointments = appointmentsData?.appointments || [];

  // Filter into Upcoming vs Past
  // Upcoming: status is BOOKED or CHECKED_IN or IN_CONSULTATION
  const upcomingAppointments = allAppointments.filter(
    (apt) => apt.status === 'BOOKED' || apt.status === 'CHECKED_IN' || apt.status === 'IN_CONSULTATION'
  );

  // Past: COMPLETED, CANCELLED, NO_SHOW
  const pastAppointments = allAppointments.filter(
    (apt) => apt.status === 'COMPLETED' || apt.status === 'CANCELLED' || apt.status === 'NO_SHOW'
  );

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            My Appointments
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Look up your clinic appointments using your 10-digit registered phone number. No login or password needed.
          </p>
        </div>

        {activePhone && (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Phone Lookup Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleLookupSubmit} className="space-y-4">
          <label htmlFor="phone-lookup-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Patient Phone Number Lookup
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="phone-lookup-input"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>

              {activePhone && (
                <button
                  type="button"
                  onClick={handleClearPhone}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Results View */}
      {!activePhone ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Enter your phone number</h3>
          <p className="text-xs text-slate-600">
            Type the 10-digit phone number you used when booking to view upcoming visits and consultation history.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          <AppointmentCardSkeleton />
          <AppointmentCardSkeleton />
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-900">{error?.message || 'Failed to retrieve appointments.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry Search
          </button>
        </div>
      ) : allAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No appointments found</h3>
            <p className="text-xs text-slate-600">
              We couldn't find any bookings matching phone number <span className="font-semibold text-slate-900">{activePhone}</span>.
            </p>
          </div>
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition shadow-xs"
          >
            <span>Book an Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Upcoming Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Upcoming Appointments</span>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {upcomingAppointments.length}
                </span>
              </h2>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-600">
                You have no upcoming appointments.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => {
                  const doctorName = apt.doctor?.name || 'Assigned Doctor';
                  const specName = apt.doctor?.specialisation?.name || 'General OPD';
                  const appointmentDateFormatted = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  const isCancellable = apt.status === 'BOOKED' || apt.status === 'CHECKED_IN';

                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{doctorName}</h3>
                            <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                              {specName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Patient: <span className="font-semibold text-slate-800">{apt.patientName}</span> ({apt.patientPhone})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={apt.status} size="md" />
                        </div>
                      </div>

                      {/* Date and details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <div>
                            <span className="block text-[10px] text-slate-600 font-bold uppercase">Date</span>
                            <span className="font-semibold text-slate-900">{appointmentDateFormatted}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <Clock className="w-4 h-4 text-teal-600" />
                          <div>
                            <span className="block text-[10px] text-slate-600 font-bold uppercase">Time Slot</span>
                            <span className="font-semibold text-slate-900">{apt.slotStart}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <User className="w-4 h-4 text-teal-600" />
                          <div>
                            <span className="block text-[10px] text-slate-600 font-bold uppercase">Reason</span>
                            <span className="font-semibold text-slate-900 truncate max-w-[140px] block">
                              {apt.reason || 'General checkup'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] text-slate-600 font-mono">
                          ID: <span className="text-slate-600">{apt.id}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCancellable && (
                            <button
                              type="button"
                              onClick={() => setAppointmentToCancel(apt)}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
                            >
                              Cancel Appointment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Past / Completed Appointments */}
          {pastAppointments.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Past & Completed History</span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {pastAppointments.length}
                </span>
              </h2>

              <div className="space-y-3">
                {pastAppointments.map((apt) => {
                  const doctorName = apt.doctor?.name || 'Assigned Doctor';
                  const appointmentDateFormatted = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-90"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{doctorName}</div>
                        <div className="text-slate-600">
                          {appointmentDateFormatted} at {apt.slotStart} • Patient: {apt.patientName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={apt.status} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Cancellation */}
      <ConfirmModal
        isOpen={Boolean(appointmentToCancel)}
        title="Cancel Appointment"
        message={
          appointmentToCancel
            ? `Are you sure you want to cancel your appointment with ${appointmentToCancel.doctor?.name || 'the doctor'} on ${new Date(
                appointmentToCancel.appointmentDate
              ).toLocaleDateString()} at ${appointmentToCancel.slotStart}? This action cannot be undone.`
            : ''
        }
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setAppointmentToCancel(null)}
      />
    </div>
  );
}
