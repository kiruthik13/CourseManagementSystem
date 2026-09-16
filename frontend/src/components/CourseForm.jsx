import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { validateCourseForm } from '../utils/validators';

export const CourseForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  instructors = [],
  loading = false,
  serverErrors = {},
}) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    credits: 3,
    duration_weeks: 12,
    instructor: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        code: initialData.code || '',
        description: initialData.description || '',
        credits: initialData.credits || 3,
        duration_weeks: initialData.duration_weeks || 12,
        instructor: initialData.instructor || '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        title: '',
        code: '',
        description: '',
        credits: 3,
        duration_weeks: 12,
        instructor: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateCourseForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Course' : 'Create New Course'}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Course Title *</label>
          <input
            type="text"
            name="title"
            className={`form-control ${(errors.title || serverErrors.title) ? 'error' : ''}`}
            placeholder="e.g. Advanced Software Architecture"
            value={formData.title}
            onChange={handleChange}
          />
          {(errors.title || serverErrors.title) && (
            <div className="field-error">{errors.title || serverErrors.title?.[0]}</div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Course Code *</label>
            <input
              type="text"
              name="code"
              className={`form-control ${(errors.code || serverErrors.code) ? 'error' : ''}`}
              placeholder="e.g. CS-401"
              value={formData.code}
              onChange={handleChange}
            />
            {(errors.code || serverErrors.code) && (
              <div className="field-error">{errors.code || serverErrors.code?.[0]}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Assign Instructor</label>
            <select
              name="instructor"
              className={`form-control ${serverErrors.instructor ? 'error' : ''}`}
              value={formData.instructor}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.full_name || `${inst.first_name} ${inst.last_name}`} ({inst.email})
                </option>
              ))}
            </select>
            {serverErrors.instructor && (
              <div className="field-error">{serverErrors.instructor?.[0]}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Credits (1-6) *</label>
            <input
              type="number"
              name="credits"
              min="1"
              max="6"
              className={`form-control ${(errors.credits || serverErrors.credits) ? 'error' : ''}`}
              value={formData.credits}
              onChange={handleChange}
            />
            {(errors.credits || serverErrors.credits) && (
              <div className="field-error">{errors.credits || serverErrors.credits?.[0]}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Duration (Weeks) *</label>
            <input
              type="number"
              name="duration_weeks"
              min="1"
              className={`form-control ${(errors.duration_weeks || serverErrors.duration_weeks) ? 'error' : ''}`}
              value={formData.duration_weeks}
              onChange={handleChange}
            />
            {(errors.duration_weeks || serverErrors.duration_weeks) && (
              <div className="field-error">{errors.duration_weeks || serverErrors.duration_weeks?.[0]}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            rows="3"
            className="form-control"
            placeholder="Detailed course description, prerequisites, and learning outcomes..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="is_active" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
            Course is active and open for enrollment
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseForm;
