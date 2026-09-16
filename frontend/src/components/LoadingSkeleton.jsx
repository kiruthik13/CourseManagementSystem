import React from 'react';

export const LoadingSkeleton = ({ type = 'card', count = 3 }) => {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className="table-container" style={{ padding: '1rem' }}>
        {items.map((_, idx) => (
          <div
            key={idx}
            style={{
              height: '48px',
              background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
              backgroundSize: '200% 100%',
              animation: 'pulse 1.5s infinite',
              borderRadius: 'var(--radius-md)',
              marginBottom: '0.75rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
      {items.map((_, idx) => (
        <div
          key={idx}
          className="card"
          style={{
            height: '180px',
            background: 'linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s infinite',
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
