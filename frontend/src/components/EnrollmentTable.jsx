import React from 'react';
import { STATUS_COLORS } from '../utils/constants';
import { formatDate, formatCompletion } from '../utils/formatters';
import { Edit, Trash2 } from 'lucide-react';

export const EnrollmentTable = ({
  enrollments = [],
  onUpdateStatus,
  onDelete,
  showStudent = true,
  showCourse = true,
  canEdit = true,
}) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {showCourse && <th>Course</th>}
            {showStudent && <th>Student</th>}
            <th>Enrollment Date</th>
            <th>Progress</th>
            <th>Status</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enr) => (
            <tr key={enr.id}>
              {showCourse && (
                <td>
                  <div>
                    <strong style={{ color: 'var(--slate-900)', fontSize: '0.9rem' }}>
                      {enr.course_title || 'Course'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                      {enr.course_code}
                    </div>
                  </div>
                </td>
              )}
              {showStudent && (
                <td>
                  <div>
                    <strong style={{ color: 'var(--slate-900)', fontSize: '0.9rem' }}>
                      {enr.student_name || 'Student'}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {enr.student_email}
                    </div>
                  </div>
                </td>
              )}
              <td style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                {formatDate(enr.enrollment_date)}
              </td>
              <td style={{ width: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="progress-bar-bg" style={{ flex: 1 }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, parseFloat(enr.completion_percentage) || 0))}%` }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)', minWidth: '38px', textAlign: 'right' }}>
                    {formatCompletion(enr.completion_percentage)}
                  </span>
                </div>
              </td>
              <td>
                <span className={`badge ${STATUS_COLORS[enr.status] || 'badge-active'}`}>
                  {enr.status}
                </span>
              </td>
              {canEdit && (
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {onUpdateStatus && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onUpdateStatus(enr)}
                        title="Update Progress/Status"
                      >
                        <Edit size={14} /> Update
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="icon-btn"
                        onClick={() => onDelete(enr)}
                        title="Delete Enrollment"
                        style={{ width: '32px', height: '32px', color: 'var(--danger-600)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnrollmentTable;
