import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Stethoscope,
  Plus,
  Edit2,
  PowerOff,
  Power,
  Layers,
  X,
} from 'lucide-react';
import {
  useDoctors,
  useCreateDoctor,
  useUpdateDoctor,
  useDeactivateDoctor,
} from '../../hooks/useDoctors.js';
import {
  useSpecialisations,
  useCreateSpecialisation,
} from '../../hooks/useSpecialisations.js';

export default function StaffDoctors() {
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [isAddSpecOpen, setIsAddSpecOpen] = useState(false);

  // Queries
  const { data: doctorsData, isLoading: isLoadingDocs } = useDoctors({
    activeOnly: 'all',
    limit: 100,
  });

  const { data: specialisations = [] } = useSpecialisations();

  const doctors = doctorsData?.doctors || [];

  // Mutations
  const createDoctorMutation = useCreateDoctor();
  const updateDoctorMutation = useUpdateDoctor();
  const deactivateDoctorMutation = useDeactivateDoctor();
  const createSpecMutation = useCreateSpecialisation();

  // Add Doctor Form
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm({
    defaultValues: {
      name: '',
      specialisationId: '',
      consultationMinutes: 15,
      slotMinutes: 15,
      startTime: '09:00',
      endTime: '13:00',
    },
  });

  // Edit Doctor Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
  } = useForm();

  // Add Specialisation Form
  const {
    register: registerSpec,
    handleSubmit: handleSpecSubmit,
    reset: resetSpec,
    formState: { errors: errorsSpec },
  } = useForm({
    defaultValues: { name: '' },
  });

  const onAddDoctor = async (data) => {
    const schedule = {
      mon: { start: data.startTime, end: data.endTime },
      tue: { start: data.startTime, end: data.endTime },
      wed: { start: data.startTime, end: data.endTime },
      thu: { start: data.startTime, end: data.endTime },
      fri: { start: data.startTime, end: data.endTime },
      sat: { start: data.startTime, end: '12:00' },
    };

    try {
      await createDoctorMutation.mutateAsync({
        name: data.name.trim(),
        specialisationId: data.specialisationId,
        consultationMinutes: Number(data.consultationMinutes),
        slotMinutes: Number(data.slotMinutes),
        schedule,
        isActive: true,
      });
      resetAdd();
      setIsAddDoctorOpen(false);
    } catch {
      // Toast handled by mutation hook
    }
  };

  const openEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setEditValue('name', doc.name);
    setEditValue('specialisationId', doc.specialisationId);
    setEditValue('consultationMinutes', doc.consultationMinutes || 15);
    setEditValue('slotMinutes', doc.slotMinutes || 15);
  };

  const onUpdateDoctor = async (data) => {
    if (!editingDoctor) return;
    try {
      await updateDoctorMutation.mutateAsync({
        id: editingDoctor.id,
        data: {
          name: data.name.trim(),
          specialisationId: data.specialisationId,
          consultationMinutes: Number(data.consultationMinutes),
          slotMinutes: Number(data.slotMinutes),
        },
      });
      setEditingDoctor(null);
    } catch {
      // Toast handled by mutation hook
    }
  };

  const onAddSpecialisation = async (data) => {
    try {
      await createSpecMutation.mutateAsync(data.name.trim());
      resetSpec();
      setIsAddSpecOpen(false);
    } catch {
      // Toast handled by mutation hook
    }
  };

  const handleToggleActive = async (doc) => {
    if (doc.isActive) {
      await deactivateDoctorMutation.mutateAsync(doc.id);
    } else {
      await updateDoctorMutation.mutateAsync({
        id: doc.id,
        data: { isActive: true },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-teal-400 bg-teal-950/80 border border-teal-800 px-2.5 py-0.5 rounded-full">
            Staff OPD Directory
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight mt-2">
            Doctors & Specialisations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage clinic specialists, consultation durations, OPD schedules, and clinical departments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddSpecOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Add Specialisation</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDoctorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* Specialisations Quick Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
          Departments ({specialisations.length}):
        </span>
        {specialisations.map((spec) => (
          <span
            key={spec.id}
            className="px-2.5 py-1 bg-slate-950 text-slate-300 border border-slate-800 rounded-lg text-xs"
          >
            {spec.name}
          </span>
        ))}
      </div>

      {/* Doctors Table with Horizontal Scrolling */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Specialisation</th>
                <th className="py-3 px-4">Consultation Time</th>
                <th className="py-3 px-4">Slot Interval</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoadingDocs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-4">
                      <div className="h-4 bg-slate-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-slate-400">
                    No doctors registered yet. Click "Add Doctor" to create one.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const specName = doc.specialisation?.name || 'General OPD';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/50 transition">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{doc.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{doc.id}</div>
                      </td>

                      {/* Specialisation */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-teal-300 bg-teal-950/80 border border-teal-800 px-2 py-0.5 rounded-full">
                          {specName}
                        </span>
                      </td>

                      {/* Consultation Mins */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {doc.consultationMinutes} mins
                      </td>

                      {/* Slot Mins */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {doc.slotMinutes} mins
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            doc.isActive
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              doc.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{doc.isActive ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDoctor(doc)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                            title="Edit doctor details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(doc)}
                            className={`p-1.5 rounded-lg transition ${
                              doc.isActive
                                ? 'bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400'
                                : 'bg-slate-800 hover:bg-emerald-950 text-slate-400 hover:text-emerald-400'
                            }`}
                            title={doc.isActive ? 'Deactivate doctor' : 'Reactivate doctor'}
                          >
                            {doc.isActive ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD DOCTOR */}
      {isAddDoctorOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Add New OPD Doctor</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddDoctorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit(onAddDoctor)} className="space-y-4">
              {/* Doctor Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Doctor Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  {...registerAdd('name', { required: 'Doctor name is required', minLength: 2 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errorsAdd.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{errorsAdd.name.message}</p>
                )}
              </div>

              {/* Specialisation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Specialisation <span className="text-rose-400">*</span>
                </label>
                <select
                  {...registerAdd('specialisationId', { required: 'Please select a specialisation' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Specialisation</option>
                  {specialisations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
                {errorsAdd.specialisationId && (
                  <p className="text-[11px] text-rose-400 mt-1">{errorsAdd.specialisationId.message}</p>
                )}
              </div>

              {/* Consult & Slot Minutes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Consult Mins
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    {...registerAdd('consultationMinutes', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Slot Interval Mins
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    {...registerAdd('slotMinutes', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    {...registerAdd('startTime', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    {...registerAdd('endTime', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  {createDoctorMutation.isPending ? 'Saving...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DOCTOR */}
      {editingDoctor && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-400" />
                <span>Edit Doctor: {editingDoctor.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onUpdateDoctor)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Doctor Name
                </label>
                <input
                  type="text"
                  {...registerEdit('name', { required: true, minLength: 2 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Specialisation
                </label>
                <select
                  {...registerEdit('specialisationId', { required: true })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  {specialisations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Consult Mins
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    {...registerEdit('consultationMinutes', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Slot Interval Mins
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    {...registerEdit('slotMinutes', { required: true })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateDoctorMutation.isPending}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  {updateDoctorMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SPECIALISATION */}
      {isAddSpecOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Add Specialisation</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSpecOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSpecSubmit(onAddSpecialisation)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Department Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ophthalmology, Neurology..."
                  {...registerSpec('name', { required: 'Department name is required' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {errorsSpec.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{errorsSpec.name.message}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSpecOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSpecMutation.isPending}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm"
                >
                  {createSpecMutation.isPending ? 'Adding...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
