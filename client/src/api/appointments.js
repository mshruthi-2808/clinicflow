import apiClient from './client.js';

export const appointmentsApi = {
  createAppointment: async (payload) => {
    const res = await apiClient.post('/appointments', payload);
    return res.data;
  },

  getAppointments: async (params = {}) => {
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });

    const res = await apiClient.get('/appointments', { params: cleanParams });
    return {
      appointments: res.data,
      meta: res.meta,
    };
  },

  getAppointmentById: async (id) => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data;
  },

  cancelAppointment: async (id) => {
    const res = await apiClient.patch(`/appointments/${id}/cancel`);
    return res.data;
  },
};
