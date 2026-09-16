import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import CourseForm from '../../components/CourseForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import courseApi from '../../api/courseApi';
import instructorApi from '../../api/instructorApi';

export const ManageCourses = () => {
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (activeFilter === 'true') params.is_active = true;
      if (activeFilter === 'false') params.is_active = false;

      const [coursesRes, instructorsRes] = await Promise.all([
        courseApi.getCourses(params),
        instructorApi.getInstructors(),
      ]);

      setCourses(coursesRes.results || (Array.isArray(coursesRes) ? coursesRes : []));
      setInstructors(instructorsRes.results || (Array.isArray(instructorsRes) ? instructorsRes : []));
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load course list.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClick = () => {
    setSelectedCourse(null);
    setServerErrors({});
    setIsFormOpen(true);
  };

  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setServerErrors({});
    setIsFormOpen(true);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setServerErrors({});

      if (selectedCourse) {
        await courseApi.updateCourse(selectedCourse.id, formData);
        toast.success(`Course '${formData.code}' updated successfully.`);
      } else {
        await courseApi.createCourse(formData);
        toast.success(`Course '${formData.code}' created successfully.`);
      }

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save course:', err);
      if (err.response?.data) {
        setServerErrors(err.response.data);
      }
      toast.error(err.response?.data?.error || 'Failed to save course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      setDeleteLoading(true);
      await courseApi.deleteCourse(courseToDelete.id);
      toast.success(`Course '${courseToDelete.code}' deleted.`);
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to delete course:', err);
      toast.error(err.response?.data?.error || 'Failed to delete course.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Manage Courses</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Create, update, assign instructors, and control course active status.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={18} /> Create Course
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by title, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--slate-500)' }} />
            <select
              className="form-control"
              style={{ width: '160px' }}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          <button className="btn btn-secondary icon-btn" onClick={loadData} title="Refresh List">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try adjusting your search criteria or create a new course."
          action={
            <button className="btn btn-primary" onClick={handleCreateClick}>
              <Plus size={18} /> Create First Course
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              userRole="admin"
              onView={() => handleEditClick(course)}
              onEdit={() => handleEditClick(course)}
              onDelete={() => handleDeleteClick(course)}
            />
          ))}
        </div>
      )}

      {/* Course Form Modal */}
      <CourseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedCourse}
        instructors={instructors}
        loading={formLoading}
        serverErrors={serverErrors}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Course"
        message={`Are you sure you want to delete course '${courseToDelete?.code} - ${courseToDelete?.title}'? This action is permanent.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ManageCourses;
