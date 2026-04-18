import { NavLink } from 'react-router-dom';
import type { NavbarProps } from './Navbar';

export function NavbarPublic({ items = [], user, onLogout, actions }: NavbarProps) {
  return (
    <nav className="ui-navbar ui-navbar--public" aria-label="Primary">
      <div className="ui-navbar__inner">
        <NavLink to="/" className="ui-navbar__brand" aria-label="Home">
          <span className="ui-navbar__brand-mark" aria-hidden="true" />
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
            <div className="ui-navbar__user">
              <span className="ui-navbar__avatar" aria-hidden="true">
                {user.firstName?.[0] ?? user.email?.[0] ?? '?'}
              </span>
              <span className="ui-navbar__user-name">
                {user.firstName ?? user.email}
              </span>
              {onLogout && (
                <button type="button" className="ui-navbar__logout" onClick={onLogout}>
                  Sign out
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
