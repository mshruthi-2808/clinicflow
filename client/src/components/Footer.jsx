import React from 'react';
import { Activity, Heart, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                Clinic<span className="text-teal-600">Flow</span>
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Modern clinic appointment scheduling and live OPD queue tracking. Designed to eliminate waiting room congestion and keep patients informed at every step.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>College Mini Project Demo • Production-grade architecture</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
              Patient Services
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/doctors" className="text-slate-600 hover:text-teal-600 transition">
                  Find Doctors & Specialists
                </Link>
              </li>
              <li>
                <Link to="/my-appointments" className="text-slate-600 hover:text-teal-600 transition">
                  My Appointments
                </Link>
              </li>
              <li>
                <Link to="/" className="text-slate-600 hover:text-teal-600 transition">
                  How ClinicFlow Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency disclaimer */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Medical Disclaimer</span>
            </div>
            <p className="text-amber-800 leading-normal">
              ClinicFlow is designed for scheduled OPD appointments. In case of an emergency, please visit the emergency room immediately or call emergency medical services.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600">
          <p>© {CURRENT_YEAR} ClinicFlow OPD Systems. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Crafted for patient convenience <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
