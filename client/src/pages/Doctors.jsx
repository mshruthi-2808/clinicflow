import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Stethoscope,
  Clock,
  Calendar,
  ArrowRight,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useDoctors } from '../hooks/useDoctors.js';
import { useSpecialisations } from '../hooks/useSpecialisations.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { DoctorCardSkeleton } from '../components/Skeleton.jsx';

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state initialized from URL query params
  const initialSearch = searchParams.get('search') || '';
  const initialSpec = searchParams.get('specialisationId') || '';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [selectedSpecialisation, setSelectedSpecialisation] = useState(initialSpec);

  // Debounce search input by 350ms
  const debouncedSearch = useDebounce(searchInput, 350);

  // Sync state to URL params when debounced search or specialisation changes
  React.useEffect(() => {
    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedSpecialisation) params.specialisationId = selectedSpecialisation;
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedSpecialisation, setSearchParams]);

  // Fetch specialisations for filter options
  const { data: specialisations = [], isLoading: isLoadingSpecs } = useSpecialisations();

  // Fetch doctors with current filters
  const { data: doctorsData, isLoading: isLoadingDoctors, isError, error, refetch } = useDoctors({
    search: debouncedSearch.trim() || undefined,
    specialisationId: selectedSpecialisation || undefined,
    limit: 20,
    sort: 'name:asc',
  });

  const doctors = doctorsData?.doctors || [];
  const totalDoctors = doctorsData?.meta?.total ?? doctors.length;

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedSpecialisation('');
  };

  const formatSchedule = (schedule) => {
    if (!schedule || typeof schedule !== 'object') return 'Weekly OPD hours';
    const days = Object.keys(schedule);
    if (days.length === 0) return 'By Appointment';
    const firstDay = schedule[days[0]];
    const start = firstDay?.start || '09:00';
    const end = firstDay?.end || '13:00';
    return `Mon – Sat: ${start} - ${end}`;
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full mb-2">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>OPD Specialist Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Our Doctors & Specialists
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Browse verified clinic specialists, view their consultation hours, and reserve a convenient appointment slot.
          </p>
        </div>

        <div className="text-xs text-slate-600 font-medium">
          Showing <span className="font-bold text-slate-900">{doctors.length}</span> of{' '}
          <span className="font-bold text-slate-900">{totalDoctors}</span> doctors
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="md:col-span-7 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="doctor-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by doctor name or specialty..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Specialisation select */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              id="specialisation-filter"
              value={selectedSpecialisation}
              onChange={(e) => setSelectedSpecialisation(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition appearance-none cursor-pointer"
            >
              <option value="">All Specialisations</option>
              {specialisations.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* Quick filter pills */}
        {!isLoadingSpecs && specialisations.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-slate-600 font-semibold whitespace-nowrap">Departments:</span>
            <button
              type="button"
              onClick={() => setSelectedSpecialisation('')}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
                selectedSpecialisation === ''
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalDoctors})
            </button>
            {specialisations.map((spec) => (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecialisation(spec.id)}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
                  selectedSpecialisation === spec.id
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor Cards Grid / Skeletons / Empty State */}
      {isLoadingDoctors ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-800">
            {error?.message || 'Failed to load doctors list.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No doctors found</h3>
            <p className="text-sm text-slate-600">
              We couldn't find any doctors matching your search or filters.
            </p>
          </div>
          {(searchInput || selectedSpecialisation) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => {
            const specName = doctor.specialisation?.name || 'General OPD';
            const initials = doctor.name
              .replace('Dr. ', '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2);

            return (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Doctor header */}
                  <div className="flex items-start gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 font-bold flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-950 truncate group-hover:text-teal-700 transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-xs font-semibold text-teal-600 bg-teal-50/80 inline-block px-2.5 py-0.5 rounded-full mt-1 border border-teal-100">
                        {specName}
                      </p>
                    </div>
                  </div>

                  {/* Doctor details */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>{doctor.consultationMinutes || 15} mins per consultation</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>{formatSchedule(doctor.schedule)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-700 font-medium">Accepting Online Bookings</span>
                    </div>
                  </div>
                </div>

                {/* Booking Action */}
                <div className="pt-5 mt-4 border-t border-slate-100">
                  <Link
                    to={`/doctors/${doctor.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-semibold text-sm border border-teal-200/80 hover:border-transparent transition shadow-2xs group-hover:shadow"
                  >
                    <span>Book Appointment</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
