import apiClient from './client.js';

export const doctorsApi = {
  getDoctors: async (params = {}) => {
    // Filter out empty params
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        cleanParams[key] = val;
      }
    });

    const res = await apiClient.get('/doctors', { params: cleanParams });
    return {
      doctors: res.data,
      meta: res.meta,
    };
  },

  getDoctorById: async (id) => {
    const res = await apiClient.get(`/doctors/${id}`);
    return res.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const res = await apiClient.get(`/doctors/${doctorId}/slots`, {
      params: { date },
    });
    return res.data;
  },
};
