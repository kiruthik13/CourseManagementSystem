import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, UserPlus } from 'lucide-react';
import InstructorTable from '../../components/InstructorTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import instructorApi from '../../api/instructorApi';

export const ManageInstructors = () => {
  const toast = useToast();

  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    qualification: '',
    experience_years: 0,
    bio: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  // Edit Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Assigned courses preview modal
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [instructorCourses, setInstructorCourses] = useState([]);

  const loadInstructors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await instructorApi.getInstructors();
      setInstructors(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load instructors:', err);
      setError('Failed to fetch instructor accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstructors();
  }, [loadInstructors]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setServerErrors({});
      await instructorApi.createInstructor(createData);
      toast.success('Instructor account created successfully.');
      setIsCreateOpen(false);
      setCreateData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        department: '',
        qualification: '',
        experience_years: 0,
        bio: '',
      });
      loadInstructors();
    } catch (err) {
      console.error('Failed to create instructor:', err);
      if (err.response?.data) {
        setServerErrors(err.response.data);
      }
      toast.error(err.response?.data?.error || 'Failed to create instructor account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (inst) => {
    setSelectedInstructor(inst);
    const p = inst.profile || {};
    setEditData({
      first_name: inst.first_name || '',
      last_name: inst.last_name || '',
      phone: inst.phone || '',
      department: p.department || '',
      qualification: p.qualification || '',
      experience_years: p.experience_years || 0,
      bio: p.bio || '',
    });
    setServerErrors({});
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      setServerErrors({});
      await instructorApi.updateInstructor(selectedInstructor.id, editData);
      toast.success('Instructor details updated successfully.');
      setIsEditOpen(false);
      loadInstructors();
    } catch (err) {
      console.error('Failed to update instructor:', err);
      if (err.response?.data) setServerErrors(err.response.data);
      toast.error('Failed to update instructor.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!instructorToDelete) return;
    try {
      setDeleteLoading(true);
      await instructorApi.deleteInstructor(instructorToDelete.id);
      toast.success('Instructor account removed.');
      setIsDeleteOpen(false);
      loadInstructors();
    } catch (err) {
      console.error('Failed to delete instructor:', err);
      toast.error(err.response?.data?.error || 'Failed to remove instructor.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewCourses = async (inst) => {
    setSelectedInstructor(inst);
    try {
      const res = await instructorApi.getInstructorCourses(inst.id);
      setInstructorCourses(res.results || []);
      setIsCoursesModalOpen(true);
    } catch (err) {
      toast.error('Failed to fetch assigned courses.');
    }
  };

  const filteredInstructors = instructors.filter((inst) => {
    const q = searchTerm.toLowerCase();
    const name = (inst.full_name || `${inst.first_name} ${inst.last_name}`).toLowerCase();
    const email = (inst.email || '').toLowerCase();
    const dept = (inst.profile?.department || '').toLowerCase();
    return name.includes(q) || email.includes(q) || dept.includes(q);
  });

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Faculty Instructors</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Register new instructors and manage academic department profiles.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => { setServerErrors({}); setIsCreateOpen(true); }}>
          <UserPlus size={18} /> Add Instructor
        </button>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by instructor name, email, or department..."
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
        <ErrorState message={error} onRetry={loadInstructors} />
      ) : filteredInstructors.length === 0 ? (
        <EmptyState
          title="No instructors found"
          description="Create your first instructor account to assign courses."
          action={
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={18} /> Add First Instructor
            </button>
          }
        />
      ) : (
        <InstructorTable
          instructors={filteredInstructors}
          onEdit={handleEditClick}
          onDelete={(inst) => { setInstructorToDelete(inst); setIsDeleteOpen(true); }}
          onViewCourses={handleViewCourses}
        />
      )}

      {/* Create Instructor Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Instructor" maxWidth="640px">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                required
                className={`form-control ${serverErrors.first_name ? 'error' : ''}`}
                value={createData.first_name}
                onChange={(e) => setCreateData({ ...createData, first_name: e.target.value })}
              />
              {serverErrors.first_name && <div className="field-error">{serverErrors.first_name[0]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                required
                className={`form-control ${serverErrors.last_name ? 'error' : ''}`}
                value={createData.last_name}
                onChange={(e) => setCreateData({ ...createData, last_name: e.target.value })}
              />
              {serverErrors.last_name && <div className="field-error">{serverErrors.last_name[0]}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                required
                className={`form-control ${serverErrors.email ? 'error' : ''}`}
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              />
              {serverErrors.email && <div className="field-error">{serverErrors.email[0]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password * (Min 8 chars)</label>
              <input
                type="password"
                required
                className={`form-control ${serverErrors.password ? 'error' : ''}`}
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
              />
              {serverErrors.password && <div className="field-error">{serverErrors.password[0]}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                className="form-control"
                value={createData.department}
                onChange={(e) => setCreateData({ ...createData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Qualification</label>
              <input
                type="text"
                placeholder="e.g. Ph.D. in AI"
                className="form-control"
                value={createData.qualification}
                onChange={(e) => setCreateData({ ...createData, qualification: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={createData.experience_years}
                onChange={(e) => setCreateData({ ...createData, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={createData.phone}
                onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Biography / Background</label>
            <textarea
              rows="2"
              className="form-control"
              value={createData.bio}
              onChange={(e) => setCreateData({ ...createData, bio: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating Account...' : 'Create Instructor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Instructor Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Instructor Profile" maxWidth="600px">
        <form onSubmit={handleEditSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={editData.first_name || ''}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={editData.last_name || ''}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                className="form-control"
                value={editData.department || ''}
                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Qualification</label>
              <input
                type="text"
                className="form-control"
                value={editData.qualification || ''}
                onChange={(e) => setEditData({ ...editData, qualification: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Experience (Years)</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={editData.experience_years || 0}
                onChange={(e) => setEditData({ ...editData, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-control"
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Biography</label>
            <textarea
              rows="3"
              className="form-control"
              value={editData.bio || ''}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={editLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Instructor Courses Modal */}
      <Modal
        isOpen={isCoursesModalOpen}
        onClose={() => setIsCoursesModalOpen(false)}
        title={`Assigned Courses: ${selectedInstructor?.full_name || ''}`}
        maxWidth="600px"
      >
        {instructorCourses.length === 0 ? (
          <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '1.5rem' }}>
            This instructor currently has no assigned courses.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {instructorCourses.map((c) => (
              <div key={c.id} style={{ padding: '0.875rem', borderRadius: 'var(--radius-lg)', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--slate-900)' }}>{c.title}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: 600 }}>{c.code}</div>
                </div>
                <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Instructor Account"
        message={`Are you sure you want to remove instructor '${instructorToDelete?.full_name}'?`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ManageInstructors;
