import React, { useState, useEffect } from 'react';
import { BookOpen, Users, GraduationCap, ClipboardList, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import StatCard from '../../components/StatCard';
import CourseCard from '../../components/CourseCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorState from '../../components/ErrorState';
import courseApi from '../../api/courseApi';
import instructorApi from '../../api/instructorApi';
import studentApi from '../../api/studentApi';
import enrollmentApi from '../../api/enrollmentApi';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalEnrollments: 0,
  });

  const [recentCourses, setRecentCourses] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, instructorsRes, studentsRes, enrollmentsRes] = await Promise.all([
        courseApi.getCourses(),
        instructorApi.getInstructors(),
        studentApi.getStudents(),
        enrollmentApi.getEnrollments(),
      ]);

      const coursesList = coursesRes.results || (Array.isArray(coursesRes) ? coursesRes : []);
      const activeCount = coursesList.filter((c) => c.is_active).length;

      setStats({
        totalCourses: coursesRes.count || coursesList.length,
        activeCourses: activeCount,
        totalInstructors: instructorsRes.count || (instructorsRes.results?.length || 0),
        totalStudents: studentsRes.count || (studentsRes.results?.length || 0),
        totalEnrollments: enrollmentsRes.count || (enrollmentsRes.results?.length || 0),
      });

      setRecentCourses(coursesList.slice(0, 4));
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
      setError('Failed to fetch system dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Banner */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-300)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            <Sparkles size={16} /> Admin Command Center
          </div>
          <h2 style={{ fontSize: '1.85rem', color: '#fff' }}>System Executive Overview</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
            Manage courses, faculty instructors, enrolled students, and system status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/courses')}>
            <Plus size={18} /> Manage Courses
          </button>
          <button className="btn btn-amber" onClick={() => navigate('/admin/instructors')}>
            <Plus size={18} /> Manage Instructors
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={stats.totalCourses}
          color="indigo"
          subtext={`${stats.activeCourses} active courses`}
        />
        <StatCard
          icon={Users}
          label="Faculty Instructors"
          value={stats.totalInstructors}
          color="amber"
          subtext="Assigned teaching faculty"
        />
        <StatCard
          icon={GraduationCap}
          label="Enrolled Students"
          value={stats.totalStudents}
          color="violet"
          subtext="Active student body"
        />
        <StatCard
          icon={ClipboardList}
          label="Total Enrollments"
          value={stats.totalEnrollments}
          color="green"
          subtext="Course registrations"
        />
      </div>

      {/* Recent Courses Section */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--slate-900)' }}>Recent Academic Courses</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/courses')}>
            View All Courses
          </button>
        </div>

        {recentCourses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--slate-500)' }}>No courses created yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {recentCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                userRole="admin"
                onView={() => navigate('/admin/courses')}
                onEdit={() => navigate('/admin/courses')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
