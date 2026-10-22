import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PatientLayout from './layouts/PatientLayout.jsx';
import StaffLayout from './layouts/StaffLayout.jsx';

import Home from './pages/Home.jsx';
import Doctors from './pages/Doctors.jsx';
import DoctorDetail from './pages/DoctorDetail.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import NotFound from './pages/NotFound.jsx';

// Lazy-load the staff pages for Phase 5
const StaffPlaceholder = lazy(() => import('./pages/StaffPlaceholder.jsx'));

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex-1 min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading ClinicFlow...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Patient layout and public patient routes */}
          <Route element={<PatientLayout />}>
            <Route index element={<Home />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Separate Staff layout (Phase 5) */}
          <Route
            path="staff"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffPlaceholder />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffPlaceholder />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
