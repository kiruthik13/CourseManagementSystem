export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Invalid email address format.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
};

export const validateCourseForm = (data) => {
  const errors = {};
  if (!data.title || !data.title.trim()) errors.title = 'Title is required.';
  if (!data.code || !data.code.trim()) errors.code = 'Course code is required.';
  if (!data.credits || data.credits < 1 || data.credits > 6) {
    errors.credits = 'Credits must be between 1 and 6.';
  }
  if (!data.duration_weeks || data.duration_weeks < 1) {
    errors.duration_weeks = 'Duration must be at least 1 week.';
  }
  return errors;
};
