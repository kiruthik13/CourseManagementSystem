import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Building, Award, GraduationCap, Hash, Save } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import { formatRoleLabel } from '../utils/formatters';

export const Profile = () => {
  const { user, updateUserProfile, refreshUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (serverErrors[name]) {
      setServerErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setServerErrors({});

    const result = await updateUserProfile(formData);
    setLoading(false);

    if (result.success) {
      toast.success('Profile details updated successfully!');
      refreshUser();
    } else {
      toast.error(result.error);
      if (result.fieldErrors) {
        setServerErrors(result.fieldErrors);
      }
    }
  };

  if (!user) return null;

  const profileExtra = user.profile || {};

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <Toast toasts={toast.toasts} removeToast={toast.removeToast} />

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Account Profile Settings</h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>
          Manage your account information and academic profile details.
        </p>
      </div>

      {/* User Summary Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-600), var(--violet-600))',
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {user.first_name?.[0] || 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--slate-900)' }}>
              {user.full_name || `${user.first_name} ${user.last_name}`}
            </h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <Mail size={15} /> {user.email}
            </p>
          </div>

          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'var(--primary-50)',
                color: 'var(--primary-700)',
                border: '1px solid var(--primary-200)',
              }}
            >
              <Shield size={14} /> {formatRoleLabel(user.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Role Specific Metadata Details */}
      {user.role === 'student' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={18} style={{ color: 'var(--primary-600)' }} /> Academic Student Metadata
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Hash size={14} /> Student ID
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--primary-700)', fontFamily: 'monospace' }}>
                {profileExtra.student_id || 'STU-NONE'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Building size={14} /> Department
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)' }}>
                {profileExtra.department || 'General'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>
                Year of Study
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)' }}>
                Year {profileExtra.year_of_study || 1}
              </strong>
            </div>
          </div>
        </div>
      )}

      {user.role === 'instructor' && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--slate-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} style={{ color: 'var(--violet-600)' }} /> Faculty Credentials & Profile
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Department</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)', display: 'block' }}>{profileExtra.department || 'Unassigned'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Qualification</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)', display: 'block' }}>{profileExtra.qualification || '—'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Teaching Experience</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--slate-800)', display: 'block' }}>{profileExtra.experience_years ? `${profileExtra.experience_years} years` : '0 years'}</strong>
            </div>
          </div>
          {profileExtra.bio && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)', textTransform: 'uppercase', fontWeight: 600 }}>Faculty Biography</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>{profileExtra.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Editable Basic User Form */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h4 style={{ fontSize: '1.1rem', color: 'var(--slate-900)', marginBottom: '1.25rem' }}>Update Personal Information</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="first_name"
                required
                className={`form-control ${serverErrors.first_name ? 'error' : ''}`}
                value={formData.first_name}
                onChange={handleChange}
              />
              {serverErrors.first_name && <div className="field-error">{serverErrors.first_name[0]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                required
                className={`form-control ${serverErrors.last_name ? 'error' : ''}`}
                value={formData.last_name}
                onChange={handleChange}
              />
              {serverErrors.last_name && <div className="field-error">{serverErrors.last_name[0]}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phone"
              className={`form-control ${serverErrors.phone ? 'error' : ''}`}
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
            {serverErrors.phone && <div className="field-error">{serverErrors.phone[0]}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
