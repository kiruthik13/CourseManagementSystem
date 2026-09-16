import React, { useState, useEffect, useCallback } from 'react';
import { Filter, RefreshCw, Edit } from 'lucide-react';
import EnrollmentTable from '../../components/EnrollmentTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import enrollmentApi from '../../api/enrollmentApi';

export const ManageEnrollments = () => {
  const toast = useToast();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Update modal state
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: 'active',
    completion_percentage: 0,
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [enrollmentToDelete, setEnrollmentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await enrollmentApi.getEnrollments(params);
      setEnrollments(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load enrollments:', err);
      setError('Failed to fetch enrollment records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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
      toast.success('Enrollment status and progress updated successfully.');
      setIsUpdateOpen(false);
      loadEnrollments();
    } catch (err) {
      console.error('Failed to update enrollment:', err);
      toast.error(err.response?.data?.error || 'Failed to update enrollment.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!enrollmentToDelete) return;
    try {
      setDeleteLoading(true);
      await enrollmentApi.deleteEnrollment(enrollmentToDelete.id);
      toast.success('Enrollment record removed.');
      setIsDeleteOpen(false);
      loadEnrollments();
    } catch (err) {
      console.error('Failed to delete enrollment:', err);
      toast.error(err.response?.data?.error || 'Failed to remove enrollment.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Master Enrollment Directory</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Monitor student course registrations, completion percentages, and status workflows.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--slate-500)' }} />
            <select
              className="form-control"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          <button className="btn btn-secondary icon-btn" onClick={loadEnrollments} title="Refresh Records">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEnrollments} />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No enrollments recorded"
          description="Student course registrations will appear here."
        />
      ) : (
        <EnrollmentTable
          enrollments={enrollments}
          onUpdateStatus={handleEditClick}
          onDelete={(enr) => { setEnrollmentToDelete(enr); setIsDeleteOpen(true); }}
        />
      )}

      {/* Update Progress & Status Modal */}
      <Modal isOpen={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} title="Update Enrollment Status & Progress" maxWidth="480px">
        <form onSubmit={handleUpdateSubmit}>
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
              <label className="form-label">Completion Percentage</label>
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
              {updateLoading ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Enrollment Record"
        message={`Are you sure you want to remove student '${enrollmentToDelete?.student_name}' from '${enrollmentToDelete?.course_code}'?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ManageEnrollments;
