import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, BookOpen, Edit, Trash2 } from 'lucide-react';
import EnrollmentTable from '../../components/EnrollmentTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import studentApi from '../../api/studentApi';
import enrollmentApi from '../../api/enrollmentApi';
import { useNavigate } from 'react-router-dom';

export const MyEnrollments = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update Progress Modal
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [completionValue, setCompletionValue] = useState(0);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Drop Course Modal
  const [isDropOpen, setIsDropOpen] = useState(false);
  const [enrollmentToDrop, setEnrollmentToDrop] = useState(null);
  const [dropLoading, setDropLoading] = useState(false);

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getStudentEnrollments();
      setEnrollments(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load my enrollments:', err);
      setError('Failed to fetch your course enrollments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleEditClick = (enr) => {
    setSelectedEnrollment(enr);
    setCompletionValue(parseFloat(enr.completion_percentage) || 0);
    setIsUpdateOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      const effectiveStatus = completionValue === 100 ? 'completed' : selectedEnrollment.status === 'completed' ? 'active' : selectedEnrollment.status;
      await enrollmentApi.updateEnrollment(selectedEnrollment.id, {
        completion_percentage: completionValue,
        status: effectiveStatus,
      });
      toast.success('Your completion progress has been updated!');
      setIsUpdateOpen(false);
      loadEnrollments();
    } catch (err) {
      console.error('Failed to update progress:', err);
      toast.error(err.response?.data?.error || 'Failed to update completion progress.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDropConfirm = async () => {
    if (!enrollmentToDrop) return;
    try {
      setDropLoading(true);
      await enrollmentApi.deleteEnrollment(enrollmentToDrop.id);
      toast.success(`Dropped course '${enrollmentToDrop.course_code}'.`);
      setIsDropOpen(false);
      loadEnrollments();
    } catch (err) {
      console.error('Failed to drop course:', err);
      toast.error(err.response?.data?.error || 'Failed to drop course.');
    } finally {
      setDropLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>My Enrolled Courses</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Track your completion progress and manage active course registrations.
          </p>
        </div>

        <button className="btn btn-secondary icon-btn" onClick={loadEnrollments} title="Refresh Enrollments">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEnrollments} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No course enrollments"
          description="You are not enrolled in any academic courses."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/student/browse-courses')}>
              <BookOpen size={18} /> Browse Catalog & Enroll
            </button>
          }
        />
      ) : (
        <EnrollmentTable
          enrollments={enrollments}
          showStudent={false}
          onUpdateStatus={handleEditClick}
          onDelete={(enr) => { setEnrollmentToDrop(enr); setIsDropOpen(true); }}
        />
      )}

      {/* Progress Update Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} title="Update My Course Progress" maxWidth="480px">
        <form onSubmit={handleUpdateSubmit}>
          <div style={{ padding: '0.875rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{selectedEnrollment?.course_title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600 }}>{selectedEnrollment?.course_code}</div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label className="form-label">Completion Percentage</label>
              <strong style={{ color: 'var(--primary-600)', fontSize: '0.95rem' }}>
                {completionValue}%
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              style={{ width: '100%', cursor: 'pointer' }}
              value={completionValue}
              onChange={(e) => setCompletionValue(parseFloat(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateOpen(false)} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateLoading}>
              {updateLoading ? 'Saving...' : 'Update My Progress'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Drop Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDropOpen}
        onClose={() => setIsDropOpen(false)}
        onConfirm={handleDropConfirm}
        title="Unenroll / Drop Course"
        message={`Are you sure you want to unenroll from '${enrollmentToDrop?.course_code} - ${enrollmentToDrop?.course_title}'?`}
        confirmText="Unenroll"
        loading={dropLoading}
      />
    </div>
  );
};

export default MyEnrollments;
