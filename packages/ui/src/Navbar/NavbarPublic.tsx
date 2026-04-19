import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { NavbarProps } from './Navbar';

export function NavbarPublic({ items = [], user, onLogout, actions }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      // Handle desktop menu
      if (menuOpen && userRef.current && !userRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="ui-navbar ui-navbar--public" aria-label="Primary">
      <div className="ui-navbar__inner">
        <NavLink to="/" className="ui-navbar__brand" aria-label="Home">
          <img src="/logo.svg" alt="" className="ui-navbar__brand-mark" />
          <span className="ui-navbar__brand-name">Code829</span>
        </NavLink>

        <ul className="ui-navbar__links">
          {items.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `ui-navbar__link${isActive ? ' ui-navbar__link--active' : ''}`
                }
              >
                {item.icon && <span className="ui-navbar__link-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ui-navbar__actions">
          {actions}
          {user ? (
            <div className="ui-navbar__user" ref={userRef}>
              <button
                type="button"
                className="ui-navbar__user-trigger"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="ui-navbar__avatar" aria-hidden="true">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="ui-navbar__avatar-img" />
                  ) : (
                    user.firstName?.[0] ?? user.email?.[0] ?? '?'
                  )}
                </span>
                <span className="ui-navbar__user-name">
                  {user.firstName ?? user.email}
                </span>
                <span className="ui-navbar__caret" aria-hidden="true">▾</span>
              </button>
              {menuOpen && (
                <div className="ui-navbar__menu" role="menu">
                  <Link to="/profile" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/purchases" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    My purchases
                  </Link>
                  <Link to="/tickets" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    My entries
                  </Link>
                  <Link to="/guest-tickets" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    Guest tickets
                  </Link>
                  {onLogout && (
                    <>
                      <div className="ui-navbar__menu-sep" role="separator" />
                      <button
                        type="button"
                        role="menuitem"
                        className="ui-navbar__menu-item ui-navbar__menu-item--danger"
                        onClick={() => {
                          setMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Sign out
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : null}
          <button
            type="button"
            className="ui-navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div 
          className="ui-navbar__mobile-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileMenuOpen(false);
            }
          }}
        >
          <div className="ui-navbar__mobile-nav">
            {items.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `ui-navbar__mobile-link${isActive ? ' ui-navbar__mobile-link--active' : ''}`
                }
              >
                {item.icon && <span className="ui-navbar__mobile-link-icon">{item.icon}</span>}
                {item.label}
              </NavLink>
            ))}
            {user && (
              <>
                <div className="ui-navbar__menu-sep" style={{ margin: 'var(--space-2) var(--space-4)' }} />
                <NavLink to="/purchases" onClick={() => setMobileMenuOpen(false)} className="ui-navbar__mobile-link">
                  My purchases
                </NavLink>
                <NavLink to="/tickets" onClick={() => setMobileMenuOpen(false)} className="ui-navbar__mobile-link">
                  My entries
                </NavLink>
                <NavLink to="/guest-tickets" onClick={() => setMobileMenuOpen(false)} className="ui-navbar__mobile-link">
                  Guest tickets
                </NavLink>
                <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className="ui-navbar__mobile-link">
                  Profile
                </NavLink>
              </>
            )}
            {!user && (
              <NavLink
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="ui-navbar__mobile-link"
              >
                Sign In
              </NavLink>
            )}
            {user && onLogout && (
              <button
                type="button"
                className="ui-navbar__mobile-link ui-navbar__mobile-signout"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
