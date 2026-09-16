import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register/', userData);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await apiClient.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/auth/profile/', profileData);
    return response.data;
  },

  createInstructor: async (instructorData) => {
    const response = await apiClient.post('/auth/create-instructor/', instructorData);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await apiClient.post('/auth/create-student/', studentData);
    return response.data;
  },
};

export default authApi;
