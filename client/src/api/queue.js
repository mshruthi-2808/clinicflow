import apiClient from './client.js';

export const queueApi = {
  // Public: Patient own queue view by appointment ID
  getAppointmentQueueView: async (appointmentId) => {
    const res = await apiClient.get(`/queue/appointment/${appointmentId}`);
    return res.data;
  },

  // Staff: Doctor live queue
  getDoctorQueue: async (doctorId, date) => {
    const params = date ? { date } : {};
    const res = await apiClient.get(`/queue/doctor/${doctorId}`, { params });
    return res.data;
  },

  // Staff: Check in booked appointment
  checkIn: async (appointmentId) => {
    const res = await apiClient.post('/queue/check-in', { appointmentId });
    return res.data;
  },

  // Staff: Call next waiting patient
  callNext: async (doctorId) => {
    const res = await apiClient.post(`/queue/doctor/${doctorId}/call-next`);
    return res.data;
  },

  // Staff: Complete consultation
  complete: async (entryId) => {
    const res = await apiClient.post(`/queue/${entryId}/complete`);
    return res.data;
  },

  // Staff: Skip waiting patient
  skip: async (entryId) => {
    const res = await apiClient.post(`/queue/${entryId}/skip`);
    return res.data;
  },
};
