import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Mail, Lock, User, Phone,
  ArrowRight, AlertCircle, Eye, EyeOff,
  BookOpen, Users, ShieldCheck,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validators';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    desc: 'Enroll in courses & track progress',
    icon: BookOpen,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    value: 'instructor',
    label: 'Instructor',
    desc: 'Create & manage your courses',
    icon: Users,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
];

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);
    const confirmErr = validateConfirmPassword(formData.password, formData.confirm_password);
    const fnErr = !formData.first_name.trim() ? 'First name is required.' : null;
    const lnErr = !formData.last_name.trim() ? 'Last name is required.' : null;

    if (emailErr || passErr || confirmErr || fnErr || lnErr) {
      setErrors({ email: emailErr, password: passErr, confirm_password: confirmErr, first_name: fnErr, last_name: lnErr });
      return;
    }

    setLoading(true);
    setServerError('');

    const result = await register({ ...formData, role: selectedRole });
    setLoading(false);

    if (result.success) {
      navigate(result.redirectPath, { replace: true });
    } else {
      setServerError(result.error || 'Registration failed. Please try again.');
      if (result.fieldErrors) {
        setErrors({
          email: result.fieldErrors.email?.[0],
          password: result.fieldErrors.password?.[0],
          confirm_password: result.fieldErrors.confirm_password?.[0],
          first_name: result.fieldErrors.first_name?.[0],
          last_name: result.fieldErrors.last_name?.[0],
        });
      }
    }
  };

  const activeRole = ROLES.find(r => r.value === selectedRole);

  const inputStyle = (hasError) => ({
    width: '100%', boxSizing: 'border-box',
    paddingTop: '0.75rem', paddingBottom: '0.75rem',
    paddingLeft: '2.5rem', paddingRight: '1rem',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '12px', color: '#fff', fontSize: '0.9375rem',
    outline: 'none', transition: 'border-color 0.2s',
  });

  const labelStyle = {
    display: 'block', fontSize: '0.85rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem',
  };

  const iconStyle = {
    position: 'absolute', left: '0.875rem', top: '50%',
    transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '2rem 1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative glows */}
      <div style={{
        position: 'fixed', top: '-8rem', left: '-8rem', width: '28rem', height: '28rem',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-8rem', right: '-8rem', width: '28rem', height: '28rem',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '2.5rem 2rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: activeRole?.gradient || 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: `0 0 30px ${activeRole?.color || '#6366f1'}66`,
            transition: 'all 0.3s',
          }}>
            <GraduationCap size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#fff', marginBottom: '0.375rem' }}>
            Create Your Account
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
            Join as a Student or Instructor
          </p>
        </div>

        {/* Role selector */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>I am registering as</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {ROLES.map(({ value, label, desc, icon: Icon, color, gradient }) => {
              const isActive = selectedRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  style={{
                    padding: '1rem',
                    background: isActive ? `${color}1a` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '14px', cursor: 'pointer',
                    transition: 'all 0.2s', textAlign: 'left',
                    boxShadow: isActive ? `0 0 20px ${color}33` : 'none',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: isActive ? gradient : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.625rem', transition: 'all 0.2s',
                  }}>
                    <Icon size={18} color={isActive ? '#fff' : 'rgba(255,255,255,0.4)'} />
                  </div>
                  <div style={{
                    fontSize: '0.875rem', fontWeight: 700,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    marginBottom: '0.2rem',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                  }}>
                    {desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Server error */}
        {serverError && (
          <div style={{
            padding: '0.875rem 1rem',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '12px',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconStyle} />
                <input
                  id="reg-first-name"
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  style={inputStyle(errors.first_name)}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.first_name ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
              </div>
              {errors.first_name && <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconStyle} />
                <input
                  id="reg-last-name"
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  style={inputStyle(errors.last_name)}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.last_name ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
              </div>
              {errors.last_name && <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.last_name}</p>}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle(errors.email)}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                onBlur={e => e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
              />
            </div>
            {errors.email && <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '0.3rem' }}>{errors.email}</p>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Phone Number <span style={{ color: 'rgba(255,255,255,0.35)' }}>(optional)</span></label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={iconStyle} />
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                style={{ ...inputStyle(false) }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
            </div>
          </div>

          {/* Passwords row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={iconStyle} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars"
                  autoComplete="new-password"
                  style={{ ...inputStyle(errors.password), paddingRight: '2.5rem' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#fca5a5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.password}</p>}
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={iconStyle} />
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter"
                  autoComplete="new-password"
                  style={{ ...inputStyle(errors.confirm_password), paddingRight: '2.5rem' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.confirm_password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirm_password && <p style={{ color: '#fca5a5', fontSize: '0.72rem', marginTop: '0.3rem' }}>{errors.confirm_password}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.875rem',
              background: loading ? `${activeRole?.color || '#6366f1'}80` : (activeRole?.gradient || 'linear-gradient(135deg, #6366f1, #8b5cf6)'),
              border: 'none', borderRadius: '12px',
              color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : `0 4px 20px ${activeRole?.color || '#6366f1'}44`,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                Creating Account...
              </>
            ) : (
              <>
                Register as {activeRole?.label} <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '1.75rem',
          fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)',
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>

        {/* Admin note */}
        <div style={{
          marginTop: '1rem', padding: '0.75rem 1rem',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '0.625rem',
        }}>
          <ShieldCheck size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: 0 }}>
            Admin accounts are created by the system administrator only.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
};

export default Register;
