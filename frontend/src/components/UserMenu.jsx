import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { formatFullName, formatRoleLabel } from '../utils/formatters';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button className="user-menu-btn" onClick={() => setOpen(!open)}>
        <div className="avatar-circle">{initials}</div>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-800)' }}>
          {formatFullName(user)}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--slate-500)' }} />
      </button>

      {open && (
        <div className="user-dropdown">
          <div style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--slate-100)', marginBottom: '0.25rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
              {formatFullName(user)}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{user.email}</p>
            <span style={{ display: 'inline-block', marginTop: '0.375rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', background: 'var(--slate-100)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--slate-600)' }}>
              {formatRoleLabel(user.role)}
            </span>
          </div>

          <NavLink
            to="/profile"
            className="dropdown-item"
            onClick={() => setOpen(false)}
          >
            <User size={16} />
            <span>Profile Settings</span>
          </NavLink>

          <button
            className="dropdown-item danger"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
