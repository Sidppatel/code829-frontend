import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface NavItem {
  label: string;
  to: string;
  Icon: React.ComponentType<{ size: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/developer', Icon: LayoutDashboard },
  { label: 'Events', to: '/developer/events', Icon: CalendarDays },
  { label: 'Analytics', to: '/developer/analytics', Icon: BarChart3 },
  { label: 'Settings', to: '/developer/settings', Icon: Settings },
];

function buildBreadcrumbs(pathname: string): string[] {
  const segments = pathname.replace(/^\/developer\/?/, '').split('/').filter(Boolean);
  const crumbs: string[] = ['Developer'];
  for (const seg of segments) {
    if (seg === 'new') crumbs.push('New');
    else if (seg === 'edit') crumbs.push('Edit');
    else crumbs.push(seg.charAt(0).toUpperCase() + seg.slice(1));
  }
  return crumbs;
}

export default function DeveloperLayout(): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  function handleLogout(): void {
    logout();
    navigate('/');
  }

  const sidebarWidth = collapsed ? '64px' : '240px';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Sidebar — hidden on mobile, shown on desktop */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          zIndex: 50,
          overflow: 'hidden',
        }}
        className="Developer-sidebar"
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? '1.25rem 0' : '1.25rem 1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: '64px',
            flexShrink: 0,
          }}
        >
          {!collapsed && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              Code829
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            padding: '0.75rem 0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            overflowY: 'auto',
          }}
        >
          {NAV_ITEMS.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/developer'}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? '0' : '0.75rem',
                padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                background: isActive
                  ? 'var(--accent-primary)'
                  : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                transition: 'background 0.15s, color 0.15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  {!collapsed && (
                    <span
                      style={{
                        color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div
          style={{
            padding: collapsed ? '0.75rem 0.5rem' : '0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {!collapsed && user && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.firstName} {user.lastName}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.role}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--color-error)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        style={{
          marginLeft: sidebarWidth,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.25s ease',
        }}
        className="Developer-main"
      >
        {/* Breadcrumb bar */}
        <header
          style={{
            height: '56px',
            padding: '0 1.5rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0,
          }}
        >
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>/</span>
              )}
              <span
                style={{
                  fontSize: '0.875rem',
                  color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                }}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </header>

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: '1.5rem',
            background: 'var(--bg-primary)',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="Developer-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          zIndex: 50,
          flexDirection: 'row',
          alignItems: 'stretch',
        }}
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/developer'}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              fontSize: '0.65rem',
              fontWeight: isActive ? 600 : 400,
              transition: 'color 0.15s',
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (max-width: 767px) {
          .Developer-sidebar { display: none !important; }
          .Developer-main { margin-left: 0 !important; padding-bottom: 60px; }
          .Developer-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

