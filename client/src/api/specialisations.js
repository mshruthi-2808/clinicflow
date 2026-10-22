import apiClient from './client.js';

export const specialisationsApi = {
  getAll: async () => {
    const res = await apiClient.get('/specialisations');
    return res.data;
  },
};
