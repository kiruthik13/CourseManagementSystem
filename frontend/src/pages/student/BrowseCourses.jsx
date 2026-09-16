import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, RefreshCw } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Toast from '../../components/Toast';
import useToast from '../../hooks/useToast';
import courseApi from '../../api/courseApi';
import studentApi from '../../api/studentApi';
import { useNavigate } from 'react-router-dom';

export const BrowseCourses = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [creditFilter, setCreditFilter] = useState('all');
  const [enrollLoadingId, setEnrollLoadingId] = useState(null);

  const loadCatalogData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const [coursesRes, myEnrollmentsRes] = await Promise.all([
        courseApi.getCourses(params),
        studentApi.getStudentEnrollments(),
      ]);

      const courseList = coursesRes.results || (Array.isArray(coursesRes) ? coursesRes : []);
      const myEnrollments = myEnrollmentsRes.results || (Array.isArray(myEnrollmentsRes) ? myEnrollmentsRes : []);

      const enrolledSet = new Set(myEnrollments.map((e) => e.course));
      setEnrolledCourseIds(enrolledSet);
      setCourses(courseList);
    } catch (err) {
      console.error('Failed to load course catalog:', err);
      setError('Failed to fetch available courses.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  const handleEnroll = async (course) => {
    if (enrolledCourseIds.has(course.id)) {
      toast.warning('You are already enrolled in this course.');
      return;
    }

    try {
      setEnrollLoadingId(course.id);
      await courseApi.enrollCourse(course.id);
      toast.success(`Successfully enrolled in '${course.code} - ${course.title}'!`);
      setEnrolledCourseIds((prev) => new Set([...prev, course.id]));
    } catch (err) {
      console.error('Enrollment failed:', err);
      toast.error(err.response?.data?.error || 'Failed to enroll in course.');
    } finally {
      setEnrollLoadingId(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (creditFilter !== 'all' && course.credits !== parseInt(creditFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Academic Course Catalog</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
            Explore available active courses, view prerequisites, and enroll in one click.
          </p>
        </div>

        <button className="btn btn-secondary icon-btn" onClick={loadCatalogData} title="Refresh Catalog">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by course title, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} style={{ color: 'var(--slate-500)' }} />
            <select
              className="form-control"
              style={{ width: '160px' }}
              value={creditFilter}
              onChange={(e) => setCreditFilter(e.target.value)}
            >
              <option value="all">All Credits</option>
              <option value="1">1 Credit</option>
              <option value="2">2 Credits</option>
              <option value="3">3 Credits</option>
              <option value="4">4 Credits</option>
              <option value="5">5 Credits</option>
              <option value="6">6 Credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCatalogData} />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses match your search"
          description="Try broadening your search term or clearing credit filters."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredCourses.map((course) => (
            <div key={course.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <CourseCard
                course={course}
                userRole="student"
                isEnrolled={enrolledCourseIds.has(course.id)}
                onEnroll={handleEnroll}
                loading={enrollLoadingId === course.id}
              />
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.5rem', width: '100%' }}
                onClick={() => navigate(`/student/courses/${course.id}`)}
              >
                View Full Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseCourses;
