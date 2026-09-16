export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
};

export const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
};

export const ROLE_REDIRECTS = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.INSTRUCTOR]: '/instructor/dashboard',
  [ROLES.STUDENT]: '/student/dashboard',
};

export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const STATUS_COLORS = {
  active: 'badge-active',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  inactive: 'badge-inactive',
};
