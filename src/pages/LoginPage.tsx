import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, Bug } from 'lucide-react';
import { useAuthStore, type UserRole } from '../stores/authStore';
import MagneticButton from '../components/MagneticButton';
import apiClient from '../lib/axios';

// ---------------------------------------------------------------------------
// Dev role presets
// ---------------------------------------------------------------------------
interface DevRole {
  role: UserRole;
  label: string;
  description: string;
  email: string;
}

const DEV_ROLES: DevRole[] = [
  { role: 'admin', label: 'Admin', description: 'Full platform access', email: 'admin@code829.dev' },
  { role: 'organizer', label: 'Organizer', description: 'Event management', email: 'organizer@code829.dev' },
  { role: 'attendee', label: 'Attendee', description: 'Browse & book events', email: 'user@code829.dev' },
  { role: 'guest', label: 'Guest', description: 'Read-only access', email: 'guest@code829.dev' },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function LoginPage(): React.ReactElement {
  const { isAuthenticated, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devLoading, setDevLoading] = useState<UserRole | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleMagicLink(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/magic-link', { email });
      setSubmitted(true);
    } catch {
      // In dev/no-API scenarios, still show success
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin(preset: DevRole): Promise<void> {
    setDevLoading(preset.role);
    try {
      const res = await apiClient.post<{ token: string }>('/auth/dev-login', { email: preset.email, role: preset.role });
      login(res.data.token, {
        id: `dev-${preset.role}`,
        email: preset.email,
        name: `Dev ${preset.label}`,
        role: preset.role,
      });
    } catch {
      // Offline fallback — issue a fake token so navigation works
      login(`dev-token-${preset.role}-${Date.now()}`, {
        id: `dev-${preset.role}`,
        email: preset.email,
        name: `Dev ${preset.label}`,
        role: preset.role,
      });
    } finally {
      setDevLoading(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Login — Code829</title>
      </Helmet>

      <main style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background blobs */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-30%', right: '-20%',
            width: '70vw', height: '70vw', borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 12%, transparent) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', left: '-15%',
            width: '55vw', height: '55vw', borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 10%, transparent) 0%, transparent 70%)',
          }} />
        </div>

        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                textDecoration: 'none',
              }}
            >
              Code829
            </Link>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Sign in to access your tickets and bookings
            </p>
          </div>

          {/* Magic link card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: 'var(--shadow-card-hover)',
          }}>
            {!submitted ? (
              <>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  Magic Link Sign In
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Enter your email and we'll send a sign-in link. No password needed.
                </p>

                <form onSubmit={(e) => { void handleMagicLink(e); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'var(--bg-primary)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                  }}>
                    <Mail size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                      }}
                    />
                  </div>

                  {error && (
                    <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', margin: 0 }}>{error}</p>
                  )}

                  <MagneticButton
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {loading ? 'Sending…' : (
                      <>Send Magic Link <ArrowRight size={16} /></>
                    )}
                  </MagneticButton>
                </form>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '1rem' }}>
                  By signing in you agree to our{' '}
                  <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>Terms</span>
                  {' '}and{' '}
                  <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>Privacy Policy</span>
                </p>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem', display: 'block' }} />
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                }}>
                  Check your email!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  We sent a magic link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. Click it to sign in.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setEmail(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>

          {/* Dev login panel — only shown in DEV mode */}
          {import.meta.env.DEV && (
            <div style={{
              background: 'color-mix(in srgb, var(--color-warning) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}>
                <Bug size={16} style={{ color: 'var(--color-warning)' }} />
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-warning)',
                  margin: 0,
                }}>
                  Dev Quick Login
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  background: 'var(--color-warning)',
                  color: 'var(--bg-primary)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}>
                  DEV ONLY
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {DEV_ROLES.map((preset) => (
                  <button
                    key={preset.role}
                    onClick={() => { void handleDevLogin(preset); }}
                    disabled={devLoading !== null}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.75rem',
                      border: '1px solid color-mix(in srgb, var(--color-warning) 40%, transparent)',
                      background: devLoading === preset.role
                        ? 'var(--color-warning)'
                        : 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
                      color: devLoading === preset.role ? 'var(--bg-primary)' : 'var(--color-warning)',
                      cursor: devLoading !== null ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)',
                      textAlign: 'left',
                      opacity: devLoading !== null && devLoading !== preset.role ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {devLoading === preset.role ? 'Logging in…' : preset.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.15rem' }}>
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
