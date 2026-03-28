import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Monitor, User, LogIn } from 'lucide-react';
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

const THEME_OPTIONS: { value: Theme; Icon: React.ComponentType<{ size: number }> }[] = [
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
  { value: 'system', Icon: Monitor },
];

export default function Navbar(): React.ReactElement {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
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
        background: scrolled ? 'var(--glass-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
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
          <Link
            to="/me/bookings"
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
