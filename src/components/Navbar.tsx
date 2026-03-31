import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, User, LogIn, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
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

const THEME_OPTIONS: { value: Theme; Icon: React.ComponentType<{ size: number }>; label: string }[] = [
  { value: 'light', Icon: Sun, label: 'Light' },
  { value: 'dark', Icon: Moon, label: 'Dark' },
  { value: 'system', Icon: Monitor, label: 'System' },
];

export default function Navbar(): React.ReactElement {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const adminPath = (user?.role as string) === 'Developer' ? '/developer' : '/admin';
  const adminLabel = (user?.role as string) === 'Developer' ? 'Developer' : 'Admin';
  const showAdminLink = isAuthenticated && user && ADMIN_ROLES.has(user.role);

  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const el = menuPanelRef.current;
    if (!el) return;

    // Focus the close button when menu opens
    const closeBtn = el.querySelector<HTMLElement>('button');
    closeBtn?.focus();

    function trapFocus(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      const focusableEls = el!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* Skip to main content — visible only on keyboard focus */}
      <a
        href="#main-content"
        style={{
          position: 'fixed',
          top: '-100px',
          left: '1rem',
          zIndex: 9999,
          padding: '0.75rem 1.5rem',
          background: 'var(--accent-primary)',
          color: 'var(--bg-primary)',
          borderRadius: '0 0 0.75rem 0.75rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '0.875rem',
          textDecoration: 'none',
          transition: 'top 0.2s ease',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '0'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-100px'; }}
      >
        Skip to main content
      </a>
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

          {/* Desktop nav links */}
          <div className="c829-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
            {showAdminLink && (
              <Link
                to={adminPath}
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
                <LayoutDashboard size={14} aria-hidden="true" />
                {adminLabel}
              </Link>
            )}
          </div>

          {/* Desktop theme toggle */}
          <div
            className="c829-nav-theme"
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
                  className="c829-icon-btn"
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

          {/* Desktop auth */}
          <div className="c829-nav-auth" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated && user ? (
              <>
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
                  <span>{user.firstName}</span>
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  aria-label="Logout"
                  className="c829-icon-btn"
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
              </>
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
          </div>

          {/* Hamburger — visible only on mobile via CSS */}
          <button
            className="c829-hamburger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </nav>
      </header>

      {/* Mobile slide-in menu */}
      <div
        className={`c829-mobile-menu${menuOpen ? ' open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div ref={menuPanelRef} className="c829-mobile-menu-panel">
          {/* Close */}
          <button
            className="c829-mobile-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>

          {/* Nav links */}
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`c829-mobile-nav-link${isActive ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}

          {showAdminLink && (
            <Link
              to={adminPath}
              className="c829-mobile-nav-link"
              style={{ color: 'var(--accent-cta)' }}
            >
              <LayoutDashboard size={16} />
              {adminLabel} Dashboard
            </Link>
          )}

          {/* Auth */}
          {isAuthenticated && user ? (
            <>
              <Link to="/me/profile" className="c829-mobile-nav-link">
                <User size={16} />
                {user.firstName} {user.lastName}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                className="c829-mobile-nav-link"
                style={{
                  background: 'none',
                  border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
                  color: 'var(--color-error)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="c829-mobile-nav-link" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
              <LogIn size={16} />
              Sign in
            </Link>
          )}

          {/* Theme switcher */}
          <div className="c829-mobile-theme-row">
            {THEME_OPTIONS.map(({ value, Icon, label }) => (
              <button
                key={value}
                className={`c829-mobile-theme-btn${theme === value ? ' active' : ''}`}
                onClick={() => setTheme(value)}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
