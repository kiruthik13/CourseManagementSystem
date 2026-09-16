import React from 'react';
import { Mail, Phone, Building, Award, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const InstructorTable = ({ instructors = [], onEdit, onDelete, onViewCourses }) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Instructor</th>
            <th>Contact</th>
            <th>Department</th>
            <th>Qualification</th>
            <th>Experience</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instructors.map((inst) => {
            const profile = inst.profile || {};
            return (
              <tr key={inst.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--violet-600)',
                        color: '#fff',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      {inst.first_name?.[0] || 'I'}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--slate-900)', fontSize: '0.925rem' }}>
                        {inst.full_name || `${inst.first_name} ${inst.last_name}`}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                        Joined {formatDate(inst.date_joined)}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} style={{ color: 'var(--slate-400)' }} /> {inst.email}
                  </div>
                  {inst.phone && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <Phone size={12} style={{ color: 'var(--slate-400)' }} /> {inst.phone}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} style={{ color: 'var(--slate-400)' }} />
                    {profile.department || '—'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={14} style={{ color: 'var(--slate-400)' }} />
                    {profile.qualification || '—'}
                  </span>
                </td>
                <td>
                  <strong style={{ color: 'var(--slate-800)', fontSize: '0.875rem' }}>
                    {profile.experience_years ? `${profile.experience_years} yrs` : '0 yrs'}
                  </strong>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {onViewCourses && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewCourses(inst)}
                        title="View Courses"
                      >
                        Courses
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="icon-btn"
                        onClick={() => onEdit(inst)}
                        title="Edit Instructor"
                        style={{ width: '32px', height: '32px' }}
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="icon-btn"
                        onClick={() => onDelete(inst)}
                        title="Delete Instructor"
                        style={{ width: '32px', height: '32px', color: 'var(--danger-600)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InstructorTable;
