import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { ROLES } from '../utils/constants';

export const Sidebar = ({ isCollapsed, toggleCollapse, mobileOpen, closeMobile }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavLinks = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/admin/courses', label: 'Courses', icon: BookOpen },
          { path: '/admin/instructors', label: 'Instructors', icon: Users },
          { path: '/admin/students', label: 'Students', icon: GraduationCap },
          { path: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList },
        ];
      case ROLES.INSTRUCTOR:
        return [
          { path: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/instructor/courses', label: 'My Courses', icon: BookOpen },
          { path: '/instructor/students', label: 'My Students', icon: GraduationCap },
        ];
      case ROLES.STUDENT:
        return [
          { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/student/browse-courses', label: 'Browse Courses', icon: BookOpen },
          { path: '/student/enrollments', label: 'My Enrollments', icon: ClipboardList },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={closeMobile}
      />

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <Sparkles size={20} />
            </div>
            {!isCollapsed && <span>EduFlow</span>}
          </div>
          <button
            className="icon-btn"
            style={{ border: 'none', color: '#cbd5e1' }}
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!isCollapsed && <div className="nav-section-title">Navigation</div>}
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
                title={isCollapsed ? link.label : ''}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            {!isCollapsed && <div className="nav-section-title">Account</div>}
            <NavLink
              to="/profile"
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={closeMobile}
              title={isCollapsed ? 'Profile' : ''}
            >
              <User size={20} />
              {!isCollapsed && <span>Profile</span>}
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item danger"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
            onClick={() => {
              closeMobile();
              logout();
            }}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
