import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import type { NavbarProps } from './Navbar';

export function NavbarPublic({ items = [], user, onLogout, actions }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!userRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <nav className="ui-navbar ui-navbar--public" aria-label="Primary">
      <div className="ui-navbar__inner">
        <NavLink to="/" className="ui-navbar__brand" aria-label="Home">
          <img src="/logo.jpg" alt="" className="ui-navbar__brand-mark" />
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
                  {user.firstName?.[0] ?? user.email?.[0] ?? '?'}
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
                  <Link to="/bookings" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    My bookings
                  </Link>
                  <Link to="/tickets" role="menuitem" className="ui-navbar__menu-item" onClick={() => setMenuOpen(false)}>
                    My tickets
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
        </div>
      </div>
    </nav>
  );
}
