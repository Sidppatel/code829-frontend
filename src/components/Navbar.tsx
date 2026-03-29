import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, User, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore, type Theme } from '../stores/themeStore';

interface NavLink {
  label: string;
  to: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Events', to: '/events' },
  { label: 'My Bookings', to: '/me/bookings' },
];

const ADMIN_ROLES = new Set(['Admin', 'Developer', 'Staff']);

const THEME_OPTIONS: { value: Theme; Icon: React.ComponentType<{ size: number }> }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

export default function Navbar(): React.ReactElement {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px color-mix(in srgb, var(--text-primary) 6%, transparent)' : 'none',
      }}
    >
      <nav
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
            marginRight: 'auto',
          }}
        >
          Code829
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                    : 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          {/* Admin/Developer link — only for admin/developer/staff roles */}
          {isAuthenticated && user && ADMIN_ROLES.has(user.role) && (() => {
            const isDeveloper = (user.role as string) === 'Developer';
            const dashboardPath = isDeveloper ? '/developer' : '/admin';
            const dashboardLabel = isDeveloper ? 'Developer' : 'Admin';
            return (
              <Link
                to={dashboardPath}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--accent-cta)',
                  textDecoration: 'none',
                  background: 'color-mix(in srgb, var(--accent-cta) 10%, transparent)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <LayoutDashboard size={14} />
                {dashboardLabel}
              </Link>
            );
          })()}
        </div>

        {/* Theme toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem',
            background: 'var(--bg-tertiary)',
            borderRadius: '999px',
            padding: '0.2rem',
            border: '1px solid var(--border)',
          }}
        >
          {THEME_OPTIONS.map(({ value, Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                aria-label={`Switch to ${value} theme`}
                aria-pressed={isActive}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isActive
                    ? 'var(--accent-primary)'
                    : 'transparent',
                  color: isActive ? 'var(--bg-primary)' : 'var(--text-tertiary)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>

        {/* Auth */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/me/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                textDecoration: 'none',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
              }}
            >
              <User size={14} />
              <span>{user.name.split(' ')[0]}</span>
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              aria-label="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--bg-primary)',
              textDecoration: 'none',
              background: 'var(--accent-primary)',
              transition: 'opacity 0.2s',
            }}
          >
            <LogIn size={14} />
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
