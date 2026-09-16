/**
 * Formats a date string into a readable date format (e.g. "Oct 15, 2026")
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

/**
 * Returns formatted user full name or fallback email/ID
 */
export const formatFullName = (user) => {
  if (!user) return 'User';
  if (user.full_name && user.full_name.trim()) return user.full_name;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.email || 'User';
};

/**
 * Formats role string for display (e.g. "instructor" -> "Instructor")
 */
export const formatRoleLabel = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Clamps completion percentage to 0 - 100 range and formats as string
 */
export const formatCompletion = (percentage) => {
  const val = parseFloat(percentage) || 0;
  return `${Math.min(100, Math.max(0, val)).toFixed(0)}%`;
};
