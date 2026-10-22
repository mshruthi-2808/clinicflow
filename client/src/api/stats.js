import apiClient from './client.js';

export const statsApi = {
  getStats: async (date) => {
    const params = date ? { date } : {};
    const res = await apiClient.get('/stats', { params });
    return res.data;
  },
};
