import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Clock, Users, CheckCircle, ArrowRight, UserCheck } from 'lucide-react';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import courseApi from '../../api/courseApi';
import studentApi from '../../api/studentApi';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [course, setCourse] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courseRes, myEnrollmentsRes] = await Promise.all([
          courseApi.getCourse(id),
          studentApi.getStudentEnrollments(),
        ]);

        setCourse(courseRes);

        const enrollmentsList = myEnrollmentsRes.results || (Array.isArray(myEnrollmentsRes) ? myEnrollmentsRes : []);
        const enrolled = enrollmentsList.some((e) => String(e.course) === String(id));
        setIsEnrolled(enrolled);
      } catch (err) {
        console.error('Failed to load course details:', err);
        setError('Course not found or access restricted.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  const handleEnroll = async () => {
    if (isEnrolled) return;
    try {
      setEnrollLoading(true);
      await courseApi.enrollCourse(id);
      toast.success(`Enrolled in '${course.code} - ${course.title}'!`);
      setIsEnrolled(true);
    } catch (err) {
      console.error('Enrollment error:', err);
      toast.error(err.response?.data?.error || 'Failed to enroll in course.');
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page-container">
        <ErrorState message={error || 'Course not found'} onRetry={() => navigate('/student/browse-courses')} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <button
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
        onClick={() => navigate('/student/browse-courses')}
      >
        <ArrowLeft size={16} /> Back to Course Catalog
      </button>

      <div className="card" style={{ padding: '2.5rem 2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.35rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-50)',
              color: 'var(--primary-700)',
              border: '1px solid var(--primary-200)',
              letterSpacing: '0.05em',
            }}
          >
            {course.code}
          </span>
          <span className={`badge ${course.is_active ? 'badge-active' : 'badge-inactive'}`}>
            {course.is_active ? 'Active & Open' : 'Inactive'}
          </span>
        </div>

        <h1 style={{ fontSize: '2rem', color: 'var(--slate-900)', marginBottom: '1rem' }}>
          {course.title}
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--slate-600)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '800px' }}>
          {course.description || 'No detailed description provided for this academic course.'}
        </p>

        {/* Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            padding: '1.25rem',
            background: 'var(--slate-50)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--slate-200)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', background: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Instructor</div>
              <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{course.instructor_name || 'Unassigned'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', background: 'var(--accent-100)', color: 'var(--accent-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Credits</div>
              <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{course.credits} Credits</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', background: '#f3e8ff', color: 'var(--violet-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</div>
              <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{course.duration_weeks} Weeks</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-lg)', background: 'var(--success-50)', color: 'var(--success-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Enrolled</div>
              <strong style={{ color: 'var(--slate-800)', fontSize: '0.95rem' }}>{course.active_enrollment_count || 0} Students</strong>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isEnrolled ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'var(--success-50)', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-xl)', color: 'var(--success-600)', fontWeight: 600, width: 'fit-content' }}>
              <CheckCircle size={20} /> You are currently enrolled in this course
            </div>
          ) : (
            <button
              className="btn btn-primary"
              style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
              onClick={handleEnroll}
              disabled={enrollLoading || !course.is_active}
            >
              <span>{enrollLoading ? 'Enrolling...' : 'Enroll in Course'}</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
