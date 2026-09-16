import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Failed to load data from server. Please check your connection.',
  onRetry = null,
}) => {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        borderColor: '#fecaca',
        background: '#fff5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--danger-50)',
          color: 'var(--danger-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertCircle size={28} />
      </div>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--danger-600)', marginBottom: '0.375rem' }}>{title}</h3>
      <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', maxWidth: '420px', marginBottom: onRetry ? '1.25rem' : '0' }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
