import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, Award, Sparkles } from 'lucide-react';
import StatCard from '../../components/StatCard';
import CourseCard from '../../components/CourseCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import courseApi from '../../api/courseApi';
import enrollmentApi from '../../api/enrollmentApi';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [myCourses, setMyCourses] = useState([]);
  const [stats, setStats] = useState({
    courseCount: 0,
    totalStudents: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, enrollmentsRes] = await Promise.all([
        courseApi.getMyCourses(),
        enrollmentApi.getEnrollments(),
      ]);

      const coursesList = coursesRes.results || (Array.isArray(coursesRes) ? coursesRes : []);
      const enrollmentsList = enrollmentsRes.results || (Array.isArray(enrollmentsRes) ? enrollmentsRes : []);

      const activeCount = enrollmentsList.filter((e) => e.status === 'active').length;
      const completedCount = enrollmentsList.filter((e) => e.status === 'completed').length;
      const uniqueStudents = new Set(enrollmentsList.map((e) => e.student)).size;

      setStats({
        courseCount: coursesList.length,
        totalStudents: uniqueStudents,
        activeEnrollments: activeCount,
        completedEnrollments: completedCount,
      });

      setMyCourses(coursesList);
    } catch (err) {
      console.error('Failed to load instructor dashboard:', err);
      setError('Failed to fetch instructor dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <ErrorState message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--slate-900), #312e81)',
          color: '#fff',
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-300)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={16} /> Faculty Portal
          </div>
          <h2 style={{ fontSize: '1.85rem', color: '#fff' }}>Welcome back, Professor {user?.last_name || user?.first_name}</h2>
          <p style={{ color: 'var(--slate-300)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            {user?.profile?.department ? `${user.profile.department} Department • ` : ''}
            {stats.courseCount} Assigned Courses
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/instructor/courses')}>
          <BookOpen size={18} /> Manage My Courses
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={BookOpen}
          label="My Assigned Courses"
          value={stats.courseCount}
          color="indigo"
          subtext="Active teaching load"
        />
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={stats.totalStudents}
          color="violet"
          subtext="Total unique students"
        />
        <StatCard
          icon={GraduationCap}
          label="Active Registrations"
          value={stats.activeEnrollments}
          color="amber"
          subtext="In progress learning"
        />
        <StatCard
          icon={Award}
          label="Completions"
          value={stats.completedEnrollments}
          color="green"
          subtext="Graduated students"
        />
      </div>

      {/* Courses Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--slate-900)' }}>My Teaching Courses</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/instructor/courses')}>
            View All Courses
          </button>
        </div>

        {myCourses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--slate-500)' }}>You are not currently assigned to any courses.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {myCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userRole="instructor"
                onView={() => navigate('/instructor/courses')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
