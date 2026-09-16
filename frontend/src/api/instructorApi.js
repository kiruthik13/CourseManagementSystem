import apiClient from './client';

export const instructorApi = {
  getInstructors: async (params = {}) => {
    const response = await apiClient.get('/instructors/', { params });
    return response.data;
  },

  getInstructor: async (id) => {
    const response = await apiClient.get(`/instructors/${id}/`);
    return response.data;
  },

  createInstructor: async (instructorData) => {
    const response = await apiClient.post('/instructors/', instructorData);
    return response.data;
  },

  updateInstructor: async (id, instructorData) => {
    const response = await apiClient.patch(`/instructors/${id}/`, instructorData);
    return response.data;
  },

  deleteInstructor: async (id) => {
    const response = await apiClient.delete(`/instructors/${id}/`);
    return response.data;
  },

  getInstructorCourses: async (id) => {
    const response = await apiClient.get(`/instructors/${id}/courses/`);
    return response.data;
  },

  getInstructorStudents: async (id) => {
    const response = await apiClient.get(`/instructors/${id}/students/`);
    return response.data;
  },
};

export default instructorApi;
