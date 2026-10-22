import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Users,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill announcement */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-800 text-xs font-semibold shadow-2xs">
              <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>Smart OPD & Live Queue Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Compassionate Care, <br />
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Zero Waiting Guesswork.
              </span>
            </h1>

            {/* One-sentence explanation */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Book guaranteed clinic appointment slots online, check in seamlessly at the reception desk, and track your live OPD queue position and estimated wait time in real time.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/doctors"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base transition shadow-sm hover:shadow group"
              >
                <span>Find Doctors & Book</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/my-appointments"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-300 shadow-2xs transition"
              >
                <CalendarCheck2 className="w-4 h-4 text-teal-600" />
                <span>My Appointments</span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> No Registration Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Live Dynamic Wait Times
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Conflict-Free Slot Scheduling
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Effortless Patient Journey
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              Three Simple Steps to See Your Doctor
            </p>
            <p className="text-sm text-slate-600">
              ClinicFlow simplifies every touchpoint so you spend less time in crowded waiting areas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-teal-300 hover:shadow-sm transition group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Book a Slot</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Search verified clinic specialists by department. Choose an available date and time slot that fits your schedule, and reserve it instantly with just your name and phone number.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-teal-300 hover:shadow-sm transition group">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Check In at Reception</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When you arrive at the clinic on your appointment day, present your booking ID or phone number. Front desk staff checks you in and assigns your live OPD queue token.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 hover:border-teal-300 hover:shadow-sm transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Track Your Queue Live</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Watch your live queue position update on your phone. See how many patients are ahead and view real-time estimated wait times calculated from current consultation velocity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Banner */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Multi-Speciality</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  General Medicine, Pediatrics, Dermatology, and more.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Punctual Slots</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  15 to 20 minute dedicated doctor consultations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Less Congestion</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Smooth patient inflow prevents crowded waiting areas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Guaranteed Privacy</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Public queue displays protect patient phone numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action bottom */}
      <section className="bg-gradient-to-r from-teal-700 to-teal-800 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to schedule your visit?
          </h2>
          <p className="text-teal-100 max-w-xl mx-auto text-sm sm:text-base">
            Find the right specialist, check available timings today or tomorrow, and book your consultation in less than a minute.
          </p>
          <div>
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 transition shadow-sm"
            >
              <span>Explore Available Doctors</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
