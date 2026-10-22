import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PatientLayout from './layouts/PatientLayout.jsx';
import StaffLayout from './layouts/StaffLayout.jsx';

import Home from './pages/Home.jsx';
import Doctors from './pages/Doctors.jsx';
import DoctorDetail from './pages/DoctorDetail.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import QueueTracking from './pages/QueueTracking.jsx';
import NotFound from './pages/NotFound.jsx';

// Lazy-load Staff portal pages
const StaffLogin = lazy(() => import('./pages/StaffLogin.jsx'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard.jsx'));
const StaffAppointments = lazy(() => import('./pages/staff/StaffAppointments.jsx'));
const StaffQueue = lazy(() => import('./pages/staff/StaffQueue.jsx'));
const StaffDoctors = lazy(() => import('./pages/staff/StaffDoctors.jsx'));

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex-1 min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Loading ClinicFlow...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Patient Layout & Routes */}
          <Route element={<PatientLayout />}>
            <Route index element={<Home />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="my-appointments" element={<MyAppointments />} />
            <Route path="queue/:appointmentId" element={<QueueTracking />} />
            {/* Alias for queue links */}
            <Route path="queue/appointment/:appointmentId" element={<QueueTracking />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Public Staff Login */}
          <Route
            path="staff/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffLogin />
              </Suspense>
            }
          />

          {/* Protected Staff Layout & Operations Area */}
          <Route
            path="staff"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <StaffLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffDashboard />
                </Suspense>
              }
            />
            <Route
              path="queue"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffQueue />
                </Suspense>
              }
            />
            <Route
              path="appointments"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffAppointments />
                </Suspense>
              }
            />
            <Route
              path="doctors"
              element={
                <Suspense fallback={<PageLoader />}>
                  <StaffDoctors />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
