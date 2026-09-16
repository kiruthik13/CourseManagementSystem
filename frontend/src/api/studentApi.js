import apiClient from './client';

export const studentApi = {
  getStudents: async (params = {}) => {
    const response = await apiClient.get('/students/', { params });
    return response.data;
  },

  getStudent: async (id) => {
    const response = await apiClient.get(`/students/${id}/`);
    return response.data;
  },

  getStudentMe: async () => {
    const response = await apiClient.get('/students/me/');
    return response.data;
  },

  getStudentEnrollments: async () => {
    const response = await apiClient.get('/students/my-enrollments/');
    return response.data;
  },
};

export default studentApi;
