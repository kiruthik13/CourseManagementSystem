import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import { ROLE_REDIRECTS } from './utils/constants';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import ManageInstructors from './pages/admin/ManageInstructors';
import ManageStudents from './pages/admin/ManageStudents';
import ManageEnrollments from './pages/admin/ManageEnrollments';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import MyCourses from './pages/instructor/MyCourses';
import MyStudents from './pages/instructor/MyStudents';
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseCourses from './pages/student/BrowseCourses';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import Profile from './pages/Profile';

// Styles
import './styles/index.css';

// Main App Layout Wrapper
const AppLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/admin/dashboard')) return 'Admin Executive Dashboard';
    if (pathname.startsWith('/admin/courses')) return 'Academic Course Management';
    if (pathname.startsWith('/admin/instructors')) return 'Faculty Instructors Directory';
    if (pathname.startsWith('/admin/students')) return 'Student Directory';
    if (pathname.startsWith('/admin/enrollments')) return 'Master Enrollment Directory';
    if (pathname.startsWith('/instructor/dashboard')) return 'Faculty Instructor Dashboard';
    if (pathname.startsWith('/instructor/courses')) return 'My Teaching Courses';
    if (pathname.startsWith('/instructor/students')) return 'My Enrolled Students';
    if (pathname.startsWith('/student/dashboard')) return 'Student Portal Dashboard';
    if (pathname.startsWith('/student/browse-courses')) return 'Academic Course Catalog';
    if (pathname.startsWith('/student/courses')) return 'Course Overview';
    if (pathname.startsWith('/student/enrollments')) return 'My Course Enrollments';
    if (pathname.startsWith('/profile')) return 'Account Profile Settings';
    return 'EduFlow';
  };

  return (
    <div className="app-container">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <div className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <Navbar
          title={getPageTitle(location.pathname)}
          toggleMobile={() => setMobileOpen(!mobileOpen)}
        />
        {children}
      </div>
    </div>
  );
};

// Root Redirect Component based on User Role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const target = ROLE_REDIRECTS[user.role] || '/login';
  return <Navigate to={target} replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ManageCourses />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/instructors"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ManageInstructors />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ManageStudents />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/enrollments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ManageEnrollments />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Instructor Protected Routes */}
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['instructor']}>
                  <AppLayout>
                    <InstructorDashboard />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/courses"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['instructor']}>
                  <AppLayout>
                    <MyCourses />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/instructor/students"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['instructor']}>
                  <AppLayout>
                    <MyStudents />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student']}>
                  <AppLayout>
                    <StudentDashboard />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/browse-courses"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student']}>
                  <AppLayout>
                    <BrowseCourses />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses/:id"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student']}>
                  <AppLayout>
                    <CourseDetails />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollments"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['student']}>
                  <AppLayout>
                    <MyEnrollments />
                  </AppLayout>
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Common Authenticated Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
