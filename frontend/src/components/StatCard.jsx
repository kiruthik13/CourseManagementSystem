import React from 'react';

export const StatCard = ({ icon: Icon, label, value, color = 'indigo', subtext = null }) => {
  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-icon ${color}`}>
          <Icon size={24} />
        </div>
      )}
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {subtext && <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>{subtext}</div>}
      </div>
    </div>
  );
};

export default StatCard;
