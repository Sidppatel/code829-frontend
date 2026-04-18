import { NavLink } from 'react-router-dom';
import type { NavbarProps } from './Navbar';

export function NavbarStaff({ items = [], user, onLogout, actions }: NavbarProps) {
  return (
    <header className="ui-navbar ui-navbar--staff" aria-label="Primary">
      <div className="ui-navbar__staff-inner">
        <NavLink to="/" className="ui-navbar__brand" aria-label="Home">
          <span className="ui-navbar__brand-mark" aria-hidden="true" />
          <span className="ui-navbar__brand-name">Code829</span>
        </NavLink>
        <ul className="ui-navbar__links ui-navbar__links--compact">
          {items.map((item) => (
            <li key={item.key}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `ui-navbar__link${isActive ? ' ui-navbar__link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ui-navbar__actions">
          {actions}
          {user && (
            <span className="ui-navbar__user-name">
              {user.firstName ?? user.email}
            </span>
          )}
          {onLogout && (
            <button type="button" className="ui-navbar__logout" onClick={onLogout}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
