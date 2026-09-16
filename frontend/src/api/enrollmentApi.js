import apiClient from './client';

export const enrollmentApi = {
  getEnrollments: async (params = {}) => {
    const response = await apiClient.get('/enrollments/', { params });
    return response.data;
  },

  getEnrollment: async (id) => {
    const response = await apiClient.get(`/enrollments/${id}/`);
    return response.data;
  },

  createEnrollment: async (enrollmentData) => {
    const response = await apiClient.post('/enrollments/', enrollmentData);
    return response.data;
  },

  updateEnrollment: async (id, updateData) => {
    const response = await apiClient.patch(`/enrollments/${id}/`, updateData);
    return response.data;
  },

  deleteEnrollment: async (id) => {
    const response = await apiClient.delete(`/enrollments/${id}/`);
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await apiClient.get('/enrollments/my-enrollments/');
    return response.data;
  },
};

export default enrollmentApi;
