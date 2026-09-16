import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Users, Edit, RefreshCw } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import Modal from '../../components/Modal';
import EnrollmentTable from '../../components/EnrollmentTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import courseApi from '../../api/courseApi';
import enrollmentApi from '../../api/enrollmentApi';

export const MyCourses = () => {
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    credits: 3,
    duration_weeks: 12,
    is_active: true,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // View Enrollments Modal state
  const [isEnrollmentsOpen, setIsEnrollmentsOpen] = useState(false);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const loadMyCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await courseApi.getMyCourses();
      setCourses(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load instructor courses:', err);
      setError('Failed to fetch your assigned courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyCourses();
  }, [loadMyCourses]);

  const handleEditClick = (course) => {
    setSelectedCourse(course);
    setEditFormData({
      title: course.title || '',
      description: course.description || '',
      credits: course.credits || 3,
      duration_weeks: course.duration_weeks || 12,
      is_active: course.is_active !== undefined ? course.is_active : true,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await courseApi.updateCourse(selectedCourse.id, editFormData);
      toast.success(`Course '${selectedCourse.code}' updated successfully.`);
      setIsEditOpen(false);
      loadMyCourses();
    } catch (err) {
      console.error('Failed to update course:', err);
      toast.error(err.response?.data?.error || 'Failed to update course.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleViewEnrollments = async (course) => {
    setSelectedCourse(course);
    setIsEnrollmentsOpen(true);
    try {
      setEnrollmentsLoading(true);
      const res = await courseApi.getCourseEnrollments(course.id);
      setCourseEnrollments(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to fetch course enrollments:', err);
      toast.error('Failed to load student enrollments for this course.');
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>My Teaching Catalog</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Courses assigned to you for instruction and student progress management.
          </p>
        </div>

        <button className="btn btn-secondary icon-btn" onClick={loadMyCourses} title="Refresh My Courses">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadMyCourses} />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No courses assigned"
          description="You have not been assigned as instructor to any active courses yet."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {courses.map((course) => (
            <div key={course.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <CourseCard
                course={course}
                userRole="instructor"
                onView={() => handleViewEnrollments(course)}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleEditClick(course)}
                >
                  <Edit size={14} /> Edit Details
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleViewEnrollments(course)}
                >
                  <Users size={14} /> View Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Course Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Course: ${selectedCourse?.code}`} maxWidth="560px">
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Course Title *</label>
            <input
              type="text"
              required
              className="form-control"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Credits (1-6) *</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                className="form-control"
                value={editFormData.credits}
                onChange={(e) => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) || 3 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (Weeks) *</label>
              <input
                type="number"
                min="1"
                required
                className="form-control"
                value={editFormData.duration_weeks}
                onChange={(e) => setEditFormData({ ...editFormData, duration_weeks: parseInt(e.target.value) || 12 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Course Description</label>
            <textarea
              rows="3"
              className="form-control"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="inst_is_active"
              checked={editFormData.is_active}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="inst_is_active" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)', cursor: 'pointer' }}>
              Course is active and open for student enrollment
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={saveLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              {saveLoading ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Course Enrollments Modal */}
      <Modal
        isOpen={isEnrollmentsOpen}
        onClose={() => setIsEnrollmentsOpen(false)}
        title={`Student Roster: ${selectedCourse?.code} - ${selectedCourse?.title}`}
        maxWidth="720px"
      >
        {enrollmentsLoading ? (
          <LoadingSkeleton type="table" count={3} />
        ) : courseEnrollments.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '2rem' }}>
            No students are currently enrolled in this course.
          </p>
        ) : (
          <EnrollmentTable
            enrollments={courseEnrollments}
            showCourse={false}
            canEdit={false}
          />
        )}
      </Modal>
    </div>
  );
};

export default MyCourses;
