import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Edit } from 'lucide-react';
import EnrollmentTable from '../../components/EnrollmentTable';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import enrollmentApi from '../../api/enrollmentApi';

export const MyStudents = () => {
  const toast = useToast();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Progress update modal state
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: 'active',
    completion_percentage: 0,
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await enrollmentApi.getEnrollments();
      setEnrollments(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load instructor enrollments:', err);
      setError('Failed to load student enrollments for your courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const handleEditClick = (enr) => {
    setSelectedEnrollment(enr);
    setUpdateData({
      status: enr.status,
      completion_percentage: parseFloat(enr.completion_percentage) || 0,
    });
    setIsUpdateOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      await enrollmentApi.updateEnrollment(selectedEnrollment.id, updateData);
      toast.success(`Updated progress for ${selectedEnrollment.student_name}.`);
      setIsUpdateOpen(false);
      loadEnrollments();
    } catch (err) {
      console.error('Failed to update student progress:', err);
      toast.error(err.response?.data?.error || 'Failed to update student progress.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enr) => {
    const q = searchTerm.toLowerCase();
    const studentName = (enr.student_name || '').toLowerCase();
    const studentEmail = (enr.student_email || '').toLowerCase();
    const courseTitle = (enr.course_title || '').toLowerCase();
    const courseCode = (enr.course_code || '').toLowerCase();
    return (
      studentName.includes(q) ||
      studentEmail.includes(q) ||
      courseTitle.includes(q) ||
      courseCode.includes(q)
    );
  });

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>My Enrolled Students</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            View and evaluate student completion progress in your courses.
          </p>
        </div>

        <button className="btn btn-secondary icon-btn" onClick={loadEnrollments} title="Refresh Student List">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by student name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            size={18}
            style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEnrollments} />
      ) : filteredEnrollments.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Students enrolled in your assigned courses will appear here."
        />
      ) : (
        <EnrollmentTable
          enrollments={filteredEnrollments}
          onUpdateStatus={handleEditClick}
          canEdit={true}
        />
      )}

      {/* Update Progress Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} title="Update Student Progress" maxWidth="480px">
        <form onSubmit={handleUpdateSubmit}>
          <div style={{ padding: '0.875rem 1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{selectedEnrollment?.student_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600 }}>
              Course: {selectedEnrollment?.course_code} - {selectedEnrollment?.course_title}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Enrollment Status</label>
            <select
              className="form-control"
              value={updateData.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setUpdateData((prev) => ({
                  ...prev,
                  status: newStatus,
                  completion_percentage: newStatus === 'completed' ? 100 : prev.completion_percentage,
                }));
              }}
            >
              <option value="active">Active</option>
              <option value="completed">Completed (100%)</option>
              <option value="cancelled">Cancelled / Dropped</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
              <label className="form-label">Completion Progress</label>
              <strong style={{ color: 'var(--primary-600)', fontSize: '0.9rem' }}>
                {updateData.completion_percentage}%
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              style={{ width: '100%', cursor: 'pointer' }}
              value={updateData.completion_percentage}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setUpdateData((prev) => ({
                  ...prev,
                  completion_percentage: val,
                  status: val === 100 ? 'completed' : prev.status === 'completed' ? 'active' : prev.status,
                }));
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUpdateOpen(false)} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updateLoading}>
              {updateLoading ? 'Saving...' : 'Update Progress'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyStudents;
