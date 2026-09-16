import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    const passErr = !formData.password ? 'Password is required.' : null;
    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }
    setLoading(true);
    setServerError('');
    const result = await login(formData);
    setLoading(false);
    if (result.success) {
      const from = location.state?.from?.pathname || result.redirectPath;
      navigate(from, { replace: true });
    } else {
      setServerError(result.error || 'Login failed. Please check your credentials.');
      if (result.fieldErrors) {
        setErrors({
          email: result.fieldErrors.email?.[0],
          password: result.fieldErrors.password?.[0],
        });
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-10rem', left: '-10rem',
        width: '30rem', height: '30rem', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10rem', right: '-10rem',
        width: '30rem', height: '30rem', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left panel – branding */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '3rem',
      }} className="login-panel-left">
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(99,102,241,0.4)',
        }}>
          <GraduationCap size={40} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: '1rem' }}>
          Course Management<br />System
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: '320px', lineHeight: 1.7 }}>
          Your all-in-one platform for managing courses, students, and instructors.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2.5rem', width: '100%', maxWidth: '300px' }}>
          {[
            { role: 'Admin', color: '#f59e0b', desc: 'Full system control' },
            { role: 'Instructor', color: '#10b981', desc: 'Manage your courses' },
            { role: 'Student', color: '#6366f1', desc: 'Track your learning' },
          ].map(({ role, color, desc }) => (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
              padding: '0.875rem 1rem', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: color, flexShrink: 0,
                boxShadow: `0 0 8px ${color}`,
              }} />
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{role}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Logo (mobile) */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            }}>
              <GraduationCap size={30} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: '#fff', marginBottom: '0.375rem' }}>
              Welcome back
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Sign in as Admin, Instructor, or Student
            </p>
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
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block', fontSize: '0.85rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                  pointerEvents: 'none',
                }} />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: '2.5rem', paddingRight: '1rem',
                    paddingTop: '0.75rem', paddingBottom: '0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${errors.email ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: '12px', color: '#fff', fontSize: '0.9375rem',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.email ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
              </div>
              {errors.email && (
                <p style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: '0.375rem' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block', fontSize: '0.85rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                  pointerEvents: 'none',
                }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: '2.5rem', paddingRight: '3rem',
                    paddingTop: '0.75rem', paddingBottom: '0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${errors.password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: '12px', color: '#fff', fontSize: '0.9375rem',
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                  onBlur={e => e.target.style.borderColor = errors.password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.875rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: '0.375rem' }}>{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.875rem',
                background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: 'center', marginTop: '1.75rem',
            fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              Register here
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: '1.5rem', padding: '0.875rem 1rem',
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              DEMO CREDENTIALS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { label: 'Admin', email: 'admin@cms.com', pass: 'Admin@1234' },
                { label: 'Instructor', email: 'instructor1@cms.com', pass: 'Instructor@1234' },
                { label: 'Student', email: 'student1@cms.com', pass: 'Student@1234' },
              ].map(({ label, email, pass }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setFormData({ email, password: pass }); setErrors({}); setServerError(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: '0.2rem 0',
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{label}:</span> {email}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) { .login-panel-left { display: flex !important; } }
        input::placeholder { color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
};

export default Login;
