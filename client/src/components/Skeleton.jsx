import React from 'react';

export function DoctorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="h-10 bg-slate-200 rounded-xl w-full pt-2" />
    </div>
  );
}

export function SlotGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-200 rounded-xl" />
      ))}
    </div>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-slate-200 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-8 bg-slate-200 rounded-lg w-24" />
      </div>
    </div>
  );
}
