import React, { useReducer } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  Stethoscope,
} from 'lucide-react';
import { useDoctor } from '../hooks/useDoctors.js';
import { useSlots } from '../hooks/useSlots.js';
import { useCreateAppointment } from '../hooks/useAppointments.js';
import { SlotGridSkeleton } from '../components/Skeleton.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  getKolkataDateString,
  getKolkataTomorrowDateString,
  getKolkataTimeString,
  timeToMinutes,
} from '../utils/dateTime.js';

// Initial State for booking workflow (evaluated in Asia/Kolkata timezone)
const initialBookingState = {
  step: 'CHOOSE_SLOT', // 'CHOOSE_SLOT' | 'ENTER_DETAILS' | 'CONFIRMED'
  date: getKolkataDateString(),
  selectedSlot: null,
  confirmedAppointment: null,
  serverError: null,
};

function bookingReducer(state, action) {
  switch (action.type) {
    case 'SET_DATE':
      return {
        ...state,
        date: action.payload,
        selectedSlot: null,
        serverError: null,
      };
    case 'SELECT_SLOT':
      return {
        ...state,
        selectedSlot: action.payload,
        step: 'ENTER_DETAILS',
        serverError: null,
      };
    case 'BACK_TO_SLOTS':
      return {
        ...state,
        step: 'CHOOSE_SLOT',
        serverError: null,
      };
    case 'SET_SERVER_ERROR':
      return {
        ...state,
        serverError: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        serverError: null,
      };
    case 'BOOKING_SUCCESS':
      return {
        ...state,
        step: 'CONFIRMED',
        confirmedAppointment: action.payload,
        serverError: null,
      };
    case 'RESET':
      return {
        ...initialBookingState,
        date: getKolkataDateString(),
      };
    default:
      return state;
  }
}

export default function DoctorDetail() {
  const { id: doctorId } = useParams();

  const [bookingState, dispatch] = useReducer(bookingReducer, initialBookingState);
  const [copiedId, setCopiedId] = React.useState(false);

  // Live current time in clinic timezone (Asia/Kolkata) that ticks every 10 seconds
  const [currentKolkataTime, setCurrentKolkataTime] = React.useState(() => getKolkataTimeString());
  const [currentKolkataDate, setCurrentKolkataDate] = React.useState(() => getKolkataDateString());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentKolkataTime(getKolkataTimeString());
      setCurrentKolkataDate(getKolkataDateString());
    }, 10000); // Check every 10s

    return () => clearInterval(timer);
  }, []);

  const todayStr = currentKolkataDate;
  const tomorrowStr = getKolkataTomorrowDateString();

  // Fetch Doctor info
  const { data: doctor, isLoading: isLoadingDoctor, isError: isDoctorError, error: doctorError } =
    useDoctor(doctorId);

  // Fetch Available Slots for selected date (refreshes periodically to catch newly booked/passed slots)
  const {
    data: slots = [],
    isLoading: isLoadingSlots,
    isError: isSlotsError,
    error: slotsError,
    refetch: refetchSlots,
  } = useSlots(doctorId, bookingState.date, {
    refetchInterval: 30000,
  });

  // Mutation for booking
  const createAppointmentMutation = useCreateAppointment();

  // React Hook Form for Patient Info
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm({
    defaultValues: {
      patientName: '',
      patientPhone: '',
      reason: '',
    },
  });

  const onSlotSelect = (slotStart) => {
    dispatch({ type: 'SELECT_SLOT', payload: slotStart });
  };

  const handleBookingSubmit = async (formData) => {
    dispatch({ type: 'CLEAR_ERROR' });

    // Client-side guard: check if slot has passed while user was filling out form
    const nowKolkataDate = getKolkataDateString();
    const nowKolkataTime = getKolkataTimeString();
    if (
      bookingState.date === nowKolkataDate &&
      timeToMinutes(bookingState.selectedSlot) <= timeToMinutes(nowKolkataTime)
    ) {
      const msg = `The ${bookingState.selectedSlot} slot has already passed for today. Please select another available time slot.`;
      dispatch({ type: 'SET_SERVER_ERROR', payload: msg });
      dispatch({ type: 'BACK_TO_SLOTS' });
      refetchSlots();
      return;
    }

    const payload = {
      doctorId,
      patientName: formData.patientName.trim(),
      patientPhone: formData.patientPhone.trim(),
      reason: formData.reason.trim() || undefined,
      appointmentDate: bookingState.date,
      slotStart: bookingState.selectedSlot,
    };

    try {
      const created = await createAppointmentMutation.mutateAsync(payload);
      dispatch({ type: 'BOOKING_SUCCESS', payload: created });
      resetForm();
    } catch (err) {
      // In case of conflict (e.g. 409 SLOT_ALREADY_BOOKED or 400 PAST_TIME), display friendly message and refresh slots
      const readableMsg =
        err.message || 'This slot is no longer available. Please choose another available time slot.';
      dispatch({ type: 'SET_SERVER_ERROR', payload: readableMsg });
      if (err.code === 'PAST_TIME' || err.code === 'SLOT_ALREADY_BOOKED' || err.code === 'PAST_DATE') {
        dispatch({ type: 'BACK_TO_SLOTS' });
      }
      refetchSlots();
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (isDoctorError || !doctor) {
    return (
      <div className="flex-1 max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Doctor Not Found</h2>
        <p className="text-sm text-slate-600">
          {doctorError?.message || 'The doctor you are looking for does not exist or has been removed.'}
        </p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const specName = doctor.specialisation?.name || 'General OPD';

  // Process slots against current live Asia/Kolkata clinic time
  const isSelectedDateToday = bookingState.date === currentKolkataDate;
  const currentMinutes = isSelectedDateToday ? timeToMinutes(currentKolkataTime) : -1;

  const processedSlots = slots.map((slot) => {
    const slotMin = timeToMinutes(slot.slotStart);
    const isPast = isSelectedDateToday && (slot.isPast || slotMin <= currentMinutes);
    const isBooked = Boolean(slot.isBooked);
    const isAvailable = Boolean(slot.isAvailable) && !isPast && !isBooked;

    return {
      ...slot,
      isAvailable,
      isBooked,
      isPast,
    };
  });

  const availableSlotsCount = processedSlots.filter((s) => s.isAvailable).length;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Doctors</span>
        </Link>
      </div>

      {/* Doctor Summary Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-xl shadow-xs flex-shrink-0">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-950">{doctor.name}</h1>
              <p className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 inline-block px-2.5 py-0.5 rounded-full">
                {specName}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  {doctor.consultationMinutes} min consultations
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  Weekly OPD
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 self-stretch sm:self-auto text-slate-600">
            <div className="font-semibold text-slate-800">Weekly Schedule</div>
            <div>Mon – Fri: 09:00 - 13:00</div>
            <div>Sat: 09:00 - 12:00</div>
          </div>
        </div>
      </div>

      {/* Booking Stepper Navigation */}
      <div className="flex items-center justify-center max-w-md mx-auto">
        <div className="flex items-center gap-3 w-full">
          {/* Step 1 badge */}
          <div className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                bookingState.step === 'CHOOSE_SLOT'
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              1
            </div>
            <span
              className={`text-xs font-semibold ${
                bookingState.step === 'CHOOSE_SLOT' ? 'text-teal-900' : 'text-slate-600'
              }`}
            >
              Select Slot
            </span>
          </div>

          <div className="h-0.5 w-8 bg-slate-200" />

          {/* Step 2 badge */}
          <div className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                bookingState.step === 'ENTER_DETAILS'
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : bookingState.step === 'CONFIRMED'
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-semibold ${
                bookingState.step === 'ENTER_DETAILS' ? 'text-teal-900' : 'text-slate-600'
              }`}
            >
              Patient Details
            </span>
          </div>

          <div className="h-0.5 w-8 bg-slate-200" />

          {/* Step 3 badge */}
          <div className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                bookingState.step === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <span
              className={`text-xs font-semibold ${
                bookingState.step === 'CONFIRMED' ? 'text-emerald-900' : 'text-slate-600'
              }`}
            >
              Confirmed
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: CHOOSE DATE AND SLOT */}
      {bookingState.step === 'CHOOSE_SLOT' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Date & Available Time Slot</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pick a date to view current open consultation slots.
              </p>
            </div>

            {/* Date Quick Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_DATE', payload: todayStr })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bookingState.date === todayStr
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_DATE', payload: tomorrowStr })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bookingState.date === tomorrowStr
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tomorrow
              </button>

              {/* Date Input */}
              <div className="relative">
                <input
                  type="date"
                  min={todayStr}
                  value={bookingState.date}
                  onChange={(e) => dispatch({ type: 'SET_DATE', payload: e.target.value })}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Slot Grid Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Slots for{' '}
                <span className="font-bold text-slate-900">
                  {new Date(bookingState.date + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </span>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-50 border border-teal-500" />
                  Available ({availableSlotsCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-300" />
                  Booked / Passed
                </span>
              </div>
            </div>

            {isLoadingSlots ? (
              <SlotGridSkeleton />
            ) : isSlotsError ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
                <p className="text-xs font-semibold text-rose-800">
                  {slotsError?.message || 'Could not load slots for this date.'}
                </p>
                <button
                  type="button"
                  onClick={() => refetchSlots()}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                >
                  Retry Slots
                </button>
              </div>
            ) : processedSlots.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No slots available for this day</p>
                <p className="text-xs text-slate-600">
                  Doctor {doctor.name} does not hold OPD hours on this date, or all slots for today have ended.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {processedSlots.map((slot) => {
                  const isAvailable = slot.isAvailable;
                  const isPast = slot.isPast;
                  const isBooked = slot.isBooked;

                  return (
                    <button
                      key={slot.slotStart}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => onSlotSelect(slot.slotStart)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isAvailable
                          ? 'bg-teal-50/60 hover:bg-teal-600 border-teal-200 hover:border-teal-600 text-teal-900 hover:text-white cursor-pointer shadow-2xs hover:shadow focus:outline-none focus:ring-2 focus:ring-teal-500'
                          : isPast
                          ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                      aria-label={`${slot.slotStart} slot ${
                        isAvailable ? 'available' : isPast ? 'passed' : 'booked'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          isPast ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {slot.slotStart}
                      </span>
                      <span
                        className={`text-[10px] mt-0.5 uppercase tracking-wider font-semibold ${
                          isAvailable
                            ? 'text-teal-700 group-hover:text-teal-100'
                            : isPast
                            ? 'text-slate-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {isAvailable ? 'Available' : isPast ? 'Passed' : 'Booked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: ENTER PATIENT DETAILS FORM */}
      {bookingState.step === 'ENTER_DETAILS' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Enter Patient Information</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                No account required. Your phone number is used to locate your booking at check-in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'BACK_TO_SLOTS' })}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Slot</span>
            </button>
          </div>

          {/* Selected Slot Summary Badge */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-600" />
              <div>
                <span className="font-bold">Reserved Slot:</span>{' '}
                <span className="font-extrabold text-sm text-teal-950">{bookingState.selectedSlot}</span>
                <span className="mx-2">•</span>
                <span>
                  {new Date(bookingState.date + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="mx-2">•</span>
                <span>{doctor.name}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => dispatch({ type: 'BACK_TO_SLOTS' })}
              className="text-xs underline font-semibold hover:text-teal-950"
            >
              Change
            </button>
          </div>

          {/* Server Error Alert (e.g. 409 Slot Conflict) */}
          {bookingState.serverError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold">Booking Conflict</p>
                <p>{bookingState.serverError}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'BACK_TO_SLOTS' })}
                    className="inline-flex items-center gap-1 font-bold text-rose-700 underline hover:text-rose-900"
                  >
                    Return to available slots grid
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Booking Form */}
          <form onSubmit={handleSubmit(handleBookingSubmit)} className="space-y-5">
            {/* Patient Name */}
            <div>
              <label htmlFor="patientName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="patientName"
                  type="text"
                  placeholder="e.g. Priya Varma"
                  {...register('patientName', {
                    required: 'Patient name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    maxLength: { value: 60, message: 'Name cannot exceed 60 characters' },
                  })}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    errors.patientName
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.patientName && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errors.patientName.message}</p>
              )}
            </div>

            {/* Patient Phone */}
            <div>
              <label htmlFor="patientPhone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number (10 Digits) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="patientPhone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  {...register('patientPhone', {
                    required: 'Phone number is required for lookup and notifications',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit mobile number',
                    },
                  })}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    errors.patientPhone
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.patientPhone && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errors.patientPhone.message}</p>
              )}
            </div>

            {/* Visit Reason */}
            <div>
              <label htmlFor="reason" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Visit <span className="text-slate-600 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  id="reason"
                  rows={3}
                  placeholder="e.g. Mild headache, viral fever follow-up, routine check..."
                  {...register('reason', {
                    maxLength: { value: 200, message: 'Reason cannot exceed 200 characters' },
                  })}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition ${
                    errors.reason
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-teal-500'
                  }`}
                />
              </div>
              {errors.reason && (
                <p className="mt-1 text-xs font-semibold text-rose-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Submit & Cancel */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => dispatch({ type: 'BACK_TO_SLOTS' })}
                disabled={createAppointmentMutation.isPending}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              >
                Back to Slots
              </button>

              <button
                type="submit"
                disabled={createAppointmentMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold text-sm transition shadow-sm"
              >
                {createAppointmentMutation.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Book Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: CONFIRMED CARD */}
      {bookingState.step === 'CONFIRMED' && bookingState.confirmedAppointment && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-10 shadow-sm space-y-6 max-w-2xl mx-auto">
          {/* Header Banner */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-950">Appointment Confirmed!</h2>
            <p className="text-sm text-slate-600">
              Your appointment has been registered in the ClinicFlow OPD schedule.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Booking Status
              </span>
              <StatusBadge status={bookingState.confirmedAppointment.status || 'BOOKED'} size="md" />
            </div>

            {/* Appointment ID */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Appointment ID
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {bookingState.confirmedAppointment.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(bookingState.confirmedAppointment.id)}
                  className="p-1 text-slate-500 hover:text-teal-700 rounded transition"
                  title="Copy Appointment ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Patient Name */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600">Patient Name</span>
              <span className="font-bold text-slate-900">
                {bookingState.confirmedAppointment.patientName}
              </span>
            </div>

            {/* Doctor */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-600">Doctor</span>
              <span className="font-bold text-slate-900">{doctor.name} ({specName})</span>
            </div>

            {/* Date & Slot */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Scheduled Time</span>
              <span className="font-bold text-teal-800">
                {new Date(bookingState.confirmedAppointment.appointmentDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at {bookingState.confirmedAppointment.slotStart}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold">Next Steps on Appointment Day:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              <li>Arrive at the clinic 10 minutes prior to your slot time.</li>
              <li>Present your Phone Number or Appointment ID to the front desk reception.</li>
              <li>Staff will check you in and assign your live consultation token number.</li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/my-appointments"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>View in My Appointments</span>
            </Link>

            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
            >
              <span>Book Another Slot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
