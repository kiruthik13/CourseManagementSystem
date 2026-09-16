import apiClient from './client';

export const courseApi = {
  getCourses: async (params = {}) => {
    const response = await apiClient.get('/courses/', { params });
    return response.data;
  },

  getCourse: async (id) => {
    const response = await apiClient.get(`/courses/${id}/`);
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await apiClient.post('/courses/', courseData);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await apiClient.patch(`/courses/${id}/`, courseData);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await apiClient.delete(`/courses/${id}/`);
    return response.data;
  },

  getMyCourses: async () => {
    const response = await apiClient.get('/courses/my-courses/');
    return response.data;
  },

  getCourseEnrollments: async (id) => {
    const response = await apiClient.get(`/courses/${id}/enrollments/`);
    return response.data;
  },

  enrollCourse: async (id) => {
    const response = await apiClient.post(`/courses/${id}/enroll/`);
    return response.data;
  },
};

export default courseApi;
