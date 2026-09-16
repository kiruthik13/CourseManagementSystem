import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import StatCard from '../../components/StatCard';
import EnrollmentTable from '../../components/EnrollmentTable';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import studentApi from '../../api/studentApi';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    enrolledCount: 0,
    completedCount: 0,
    totalCredits: 0,
    avgCompletion: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getStudentEnrollments();
      const list = res.results || (Array.isArray(res) ? res : []);
      setEnrollments(list);

      const completed = list.filter((e) => e.status === 'completed').length;
      const totalComp = list.reduce((acc, curr) => acc + (parseFloat(curr.completion_percentage) || 0), 0);
      const avgComp = list.length > 0 ? (totalComp / list.length).toFixed(0) : 0;

      setStats({
        enrolledCount: list.length,
        completedCount: completed,
        totalCredits: list.length * 3, // Average standard course credits
        avgCompletion: avgComp,
      });
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError('Failed to fetch your academic record.');
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
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--slate-900), #1e1b4b)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-500)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={16} /> Student Dashboard
          </div>
          <h2 style={{ fontSize: '1.85rem', color: '#fff' }}>Welcome, {user?.first_name || 'Student'}!</h2>
          <p style={{ color: 'var(--slate-300)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Student ID: <strong>{user?.profile?.student_id || 'STU-STUDENT'}</strong> • {stats.enrolledCount} Active Course Enrollments
          </p>
        </div>

        <button className="btn btn-amber" onClick={() => navigate('/student/browse-courses')}>
          <BookOpen size={18} /> Browse Courses <ArrowRight size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={stats.enrolledCount}
          color="indigo"
          subtext="Active learning schedule"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Courses"
          value={stats.completedCount}
          color="green"
          subtext="Finished coursework"
        />
        <StatCard
          icon={Award}
          label="Average Progress"
          value={`${stats.avgCompletion}%`}
          color="amber"
          subtext="Across all courses"
        />
      </div>

      {/* Enrollments Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--slate-900)' }}>My Enrolled Courses</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/enrollments')}>
            View All Enrollments
          </button>
        </div>

        {enrollments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h4 style={{ color: 'var(--slate-800)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              You are not enrolled in any courses yet.
            </h4>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Browse the course catalog to discover and enroll in available active courses.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/student/browse-courses')}>
              <BookOpen size={18} /> Browse Course Catalog
            </button>
          </div>
        ) : (
          <EnrollmentTable
            enrollments={enrollments}
            showStudent={false}
            canEdit={false}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
