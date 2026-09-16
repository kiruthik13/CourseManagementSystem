import React from 'react';
import { Mail, Hash, BookOpen, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const StudentTable = ({ students = [], onViewDetails, onEdit, onDelete }) => {
  const hasActions = onViewDetails || onEdit || onDelete;
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Student Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Year of Study</th>
            <th>Joined</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const profile = student.profile || {};
            return (
              <tr key={student.id}>
                <td>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--primary-700)',
                      background: 'var(--primary-50)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Hash size={12} /> {profile.student_id || 'STU-NEW'}
                  </span>
                </td>
                <td>
                  <strong style={{ color: 'var(--slate-900)', fontSize: '0.925rem' }}>
                    {student.full_name || `${student.first_name} ${student.last_name}`}
                  </strong>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} style={{ color: 'var(--slate-400)' }} /> {student.email}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)' }}>
                    {profile.department || 'General'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                    Year {profile.year_of_study || 1}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                  {formatDate(student.date_joined)}
                </td>
                {hasActions && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {onViewDetails && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onViewDetails(student)}
                          title="View Details"
                        >
                          Details
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: 'var(--primary-700)',
                            borderColor: 'var(--primary-200)',
                            background: 'var(--primary-50)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => onEdit(student)}
                          title="Edit Student"
                        >
                          <Edit size={13} /> Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: 'var(--rose-600)',
                            borderColor: 'rgba(239, 68, 68, 0.25)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          onClick={() => onDelete(student)}
                          title="Delete Student"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
