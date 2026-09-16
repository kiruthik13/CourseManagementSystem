import React from 'react';
import { BookOpen, Clock, Award, Users, CheckCircle, ArrowRight } from 'lucide-react';

export const CourseCard = ({
  course,
  userRole,
  isEnrolled = false,
  onEnroll,
  onView,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const { title, code, credits, duration_weeks, instructor_name, is_active, active_enrollment_count } = course;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            border: '1px solid var(--primary-200)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {code}
        </span>
        <span className={`badge ${is_active ? 'badge-active' : 'badge-inactive'}`}>
          {is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-900)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Instructor:</span>
        <strong style={{ color: 'var(--slate-700)' }}>{instructor_name || 'Unassigned'}</strong>
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'var(--slate-50)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.25rem',
          marginTop: 'auto',
          fontSize: '0.8rem',
          color: 'var(--slate-600)',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
            <Award size={14} /> Credits
          </div>
          <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{credits}</strong>
        </div>
        <div>
          <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
            <Clock size={14} /> Duration
          </div>
          <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{duration_weeks}w</strong>
        </div>
        <div>
          <div style={{ color: 'var(--slate-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
            <Users size={14} /> Enrolled
          </div>
          <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{active_enrollment_count || 0}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {userRole === 'student' && (
          isEnrolled ? (
            <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', color: 'var(--success-600)', borderColor: '#bbf7d0', background: 'var(--success-50)' }}>
              <CheckCircle size={16} /> Enrolled
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%' }}
              onClick={() => onEnroll && onEnroll(course)}
              disabled={loading || !is_active}
            >
              <span>{loading ? 'Enrolling...' : 'Enroll Now'}</span>
              <ArrowRight size={16} />
            </button>
          )
        )}

        {userRole === 'admin' && (
          <>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onView && onView(course)}>
              View
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit && onEdit(course)}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete && onDelete(course)}>
              Delete
            </button>
          </>
        )}

        {userRole === 'instructor' && (
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => onView && onView(course)}>
            Manage Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
