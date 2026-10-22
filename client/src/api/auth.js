import apiClient from './client.js';

export const authApi = {
  login: async ({ email, password }) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
};
