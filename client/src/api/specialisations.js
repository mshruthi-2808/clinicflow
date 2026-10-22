import apiClient from './client.js';

export const specialisationsApi = {
  getAll: async () => {
    const res = await apiClient.get('/specialisations');
    return res.data;
  },

  create: async (name) => {
    const res = await apiClient.post('/specialisations', { name });
    return res.data;
  },
};
