import { NavLink } from 'react-router-dom';
import type { NavbarProps, NavItem } from './Navbar';

function groupItems(items: NavItem[]): Array<{ title: string | null; items: NavItem[] }> {
  const groups = new Map<string | null, NavItem[]>();
  for (const item of items) {
    const key = item.group ?? null;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([title, items]) => ({ title, items }));
}

export function NavbarSidebar({
  items = [],
  user,
  onLogout,
  collapsed = false,
  onToggleCollapsed,
  actions,
  children,
}: NavbarProps) {
  const groups = groupItems(items);
  const aside = (
    <aside
      className={`ui-navbar ui-navbar--sidebar${collapsed ? ' ui-navbar--collapsed' : ''}`}
      aria-label="Primary"
    >
      <div className="ui-navbar__sidebar-brand">
        <span className="ui-navbar__brand-mark" aria-hidden="true" />
        {!collapsed && <span className="ui-navbar__brand-name">Code829</span>}
      </div>

      <nav className="ui-navbar__sidebar-nav">
        {groups.map((g, idx) => (
          <div key={g.title ?? `group-${idx}`} className="ui-navbar__group">
            {g.title && !collapsed && (
              <div className="ui-navbar__group-title">{g.title}</div>
            )}
            <ul className="ui-navbar__sidebar-list">
              {g.items.map((item) => (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `ui-navbar__sidebar-link${isActive ? ' ui-navbar__sidebar-link--active' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon && <span className="ui-navbar__link-icon">{item.icon}</span>}
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="ui-navbar__sidebar-footer">
        {user && !collapsed && (
          <div className="ui-navbar__user">
            <span className="ui-navbar__avatar" aria-hidden="true">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="ui-navbar__avatar-img" />
              ) : (
                user.firstName?.[0] ?? user.email?.[0] ?? '?'
              )}
            </span>
            <div className="ui-navbar__user-text">
              <div className="ui-navbar__user-name">
                {user.firstName} {user.lastName}
              </div>
              {user.roleLabel && <div className="ui-navbar__user-role">{user.roleLabel}</div>}
            </div>
          </div>
        )}
        <div className="ui-navbar__sidebar-actions">
          {onToggleCollapsed && (
            <button
              type="button"
              className="ui-navbar__icon-btn"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none">
                <path
                  d={collapsed ? 'M5 3L9 7L5 11' : 'M9 3L5 7L9 11'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {onLogout && (
            <button type="button" className="ui-navbar__logout" onClick={onLogout}>
              {collapsed ? '⎋' : 'Sign out'}
            </button>
          )}
          {actions}
        </div>
      </div>
      {children}
    </aside>
  );

  return aside;
}
