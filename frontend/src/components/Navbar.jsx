import React from 'react';
import { Menu } from 'lucide-react';
import UserMenu from './UserMenu';
import useAuth from '../hooks/useAuth';
import { formatRoleLabel } from '../utils/formatters';

export const Navbar = ({ title, toggleMobile }) => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="icon-btn mobile-toggle" onClick={toggleMobile} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="page-header-title">{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.role && (
          <span className={`badge badge-role`} style={{ textTransform: 'capitalize', padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--primary-100)', color: 'var(--primary-700)', border: '1px solid var(--primary-300)' }}>
            {formatRoleLabel(user.role)}
          </span>
        )}
        <UserMenu />
      </div>
    </header>
  );
};

export default Navbar;
