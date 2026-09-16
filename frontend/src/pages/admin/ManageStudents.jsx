import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Hash, Mail, Phone, Calendar, Building, GraduationCap } from 'lucide-react';
import StudentTable from '../../components/StudentTable';
import Modal from '../../components/Modal';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import studentApi from '../../api/studentApi';
import authApi from '../../api/authApi';
import { formatDate } from '../../utils/formatters';

export const ManageStudents = () => {
  const toast = useToast();

  const [students, setStudents] = useState([]);
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
    year_of_study: 1,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  // Details Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Edit Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState(null);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    year_of_study: 1,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getStudents();
      setStudents(res.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      setServerErrors({});
      const res = await studentApi.createStudent(createData);
      toast.success(`Student created! Assigned Student ID: ${res.student?.profile?.student_id || res.profile?.student_id || 'Auto-generated'}`);
      setIsCreateOpen(false);
      setCreateData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        department: '',
        year_of_study: 1,
      });
      loadStudents();
    } catch (err) {
      console.error('Failed to create student:', err);
      if (err.response?.data) {
        setServerErrors(err.response.data);
      }
      toast.error(err.response?.data?.error || 'Failed to create student account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

  const handleEditClick = (student) => {
    setSelectedStudentForEdit(student);
    const p = student.profile || {};
    setEditData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      phone: student.phone || '',
      department: p.department || '',
      year_of_study: p.year_of_study || 1,
    });
    setServerErrors({});
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;
    try {
      setEditLoading(true);
      setServerErrors({});
      await studentApi.updateStudent(selectedStudentForEdit.id, editData);
      toast.success('Student details updated successfully.');
      setIsEditOpen(false);
      loadStudents();
    } catch (err) {
      console.error('Failed to update student:', err);
      if (err.response?.data) {
        setServerErrors(err.response.data);
      }
      toast.error(err.response?.data?.error || 'Failed to update student.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    try {
      setDeleteLoading(true);
      await studentApi.deleteStudent(studentToDelete.id);
      toast.success('Student account removed.');
      setIsDeleteOpen(false);
      setStudentToDelete(null);
      loadStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
      toast.error(err.response?.data?.error || 'Failed to remove student.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredStudents = students.filter((stu) => {
    const q = searchTerm.toLowerCase();
    const name = (stu.full_name || `${stu.first_name} ${stu.last_name}`).toLowerCase();
    const email = (stu.email || '').toLowerCase();
    const stuId = (stu.profile?.student_id || '').toLowerCase();
    const dept = (stu.profile?.department || '').toLowerCase();
    return name.includes(q) || email.includes(q) || stuId.includes(q) || dept.includes(q);
  });

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Enrolled Student Body</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Register, view, update, and manage student accounts and academic profiles.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => { setServerErrors({}); setIsCreateOpen(true); }}>
          <UserPlus size={18} /> Register Student
        </button>
      </div>

      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by student name, email, student ID, or department..."
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
        <ErrorState message={error} onRetry={loadStudents} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Register student accounts to enable course enrollment."
          action={
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              <UserPlus size={18} /> Register First Student
            </button>
          }
        />
      ) : (
        <StudentTable
          students={filteredStudents}
          onViewDetails={handleViewDetails}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Create Student Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Register New Student" maxWidth="600px">
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
                placeholder="e.g. Electrical Engineering"
                className="form-control"
                value={createData.department}
                onChange={(e) => setCreateData({ ...createData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study (1-6)</label>
              <input
                type="number"
                min="1"
                max="6"
                className="form-control"
                value={createData.year_of_study}
                onChange={(e) => setCreateData({ ...createData, year_of_study: parseInt(e.target.value) || 1 })}
              />
            </div>
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

          <div style={{ background: 'var(--slate-50)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1.25rem' }}>
            💡 <strong>Auto Student ID:</strong> A collision-safe unique Student ID (e.g. STU-2026-0001) will be generated atomically on submission.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={createLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student Profile" maxWidth="600px">
        <form onSubmit={handleEditSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                required
                className={`form-control ${serverErrors.first_name ? 'error' : ''}`}
                value={editData.first_name}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
              />
              {serverErrors.first_name && <div className="field-error">{serverErrors.first_name[0]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                required
                className={`form-control ${serverErrors.last_name ? 'error' : ''}`}
                value={editData.last_name}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
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
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
              {serverErrors.email && <div className="field-error">{serverErrors.email[0]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                className="form-control"
                value={editData.department}
                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Year of Study (1-6)</label>
              <input
                type="number"
                min="1"
                max="6"
                className="form-control"
                value={editData.year_of_study}
                onChange={(e) => setEditData({ ...editData, year_of_study: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={editLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={editLoading}>
              {editLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete Student" maxWidth="440px">
        {studentToDelete && (
          <div>
            <p style={{ color: 'var(--slate-700)', fontSize: '0.925rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              Are you sure you want to delete student{' '}
              <strong>{studentToDelete.full_name || `${studentToDelete.first_name} ${studentToDelete.last_name}`}</strong>{' '}
              ({studentToDelete.profile?.student_id || studentToDelete.email})?
            </p>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--rose-700)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              ⚠️ Warning: This will permanently remove the student account and their course enrollments.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ background: 'var(--rose-600)', color: '#fff', border: 'none' }}
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Student Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Student Profile Overview" maxWidth="520px">
        {selectedStudent && (
          <div>
            <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--slate-100)', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-600), var(--violet-600))',
                  color: '#fff',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                {selectedStudent.first_name?.[0] || 'S'}
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--slate-900)' }}>
                {selectedStudent.full_name || `${selectedStudent.first_name} ${selectedStudent.last_name}`}
              </h3>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--primary-700)',
                  background: 'var(--primary-50)',
                  padding: '0.25rem 0.625rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  display: 'inline-block',
                  marginTop: '0.35rem',
                }}
              >
                {selectedStudent.profile?.student_id || 'STU-NONE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Mail size={14} /> Email
                </span>
                <strong style={{ color: 'var(--slate-800)' }}>{selectedStudent.email}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Phone size={14} /> Phone
                </span>
                <strong style={{ color: 'var(--slate-800)' }}>{selectedStudent.phone || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Building size={14} /> Department
                </span>
                <strong style={{ color: 'var(--slate-800)' }}>{selectedStudent.profile?.department || 'General'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <GraduationCap size={14} /> Academic Year
                </span>
                <strong style={{ color: 'var(--slate-800)' }}>Year {selectedStudent.profile?.year_of_study || 1}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageStudents;
