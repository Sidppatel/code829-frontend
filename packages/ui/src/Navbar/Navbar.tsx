import React from 'react';
import { NavbarPublic } from './NavbarPublic';
import { NavbarSidebar } from './NavbarSidebar';
import { NavbarStaff } from './NavbarStaff';
import './Navbar.css';

export type NavbarVariant = 'public' | 'admin' | 'staff' | 'developer';

export interface NavItem {
  key: string;
  to: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
  end?: boolean;
}

export interface NavbarUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleLabel?: string;
  avatarUrl?: string;
}

export interface NavbarProps {
  variant: NavbarVariant;
  items?: NavItem[];
  user?: NavbarUser | null;
  onLogout?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function Navbar(props: NavbarProps) {
  const { variant } = props;
  if (variant === 'public') return <NavbarPublic {...props} />;
  if (variant === 'staff') return <NavbarStaff {...props} />;
  return <NavbarSidebar {...props} />;
}
