import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  action = null,
}) => {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '3.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--slate-100)',
          color: 'var(--slate-400)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-900)', marginBottom: '0.375rem' }}>{title}</h3>
      <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', maxWidth: '400px', marginBottom: action ? '1.5rem' : '0' }}>
        {description}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;
