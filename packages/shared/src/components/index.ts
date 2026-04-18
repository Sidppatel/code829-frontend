/**
 * Global index for composite/shared components living in `@code829/shared`.
 * Premium UI primitives (Button, Input, Navbar, etc.) live in `@code829/ui`.
 *
 * Keep this barrel thin — one line per component, grouped by folder.
 */

// UI composites (Ant-based, legacy; will migrate to @code829/ui in Phase 2)
export * from './ui';

// Auth
export { default as AdminLoginForm } from './auth/AdminLoginForm';
export { default as ForgotPasswordForm } from './auth/ForgotPasswordForm';
export { default as InvitationSignupForm } from './auth/InvitationSignupForm';
export { default as ProfileSetupForm } from './auth/ProfileSetupForm';
export { default as ProtectedRoute } from './auth/ProtectedRoute';
export { default as ResetPasswordForm } from './auth/ResetPasswordForm';

// Events
export { default as EventCard } from './events/EventCard';
export { default as EventImageFallback } from './events/EventImageFallback';

// Layout (legacy Ant shells — superseded by @code829/ui Navbar/Footer)
export { default as PagePreamble } from './layout/PagePreamble';
export { default as SidebarNav } from './layout/SidebarNav';
export { default as TopHeader } from './layout/TopHeader';

// Shared
export { default as AddressAutocomplete } from './shared/AddressAutocomplete';
export { default as AvatarUpload } from './shared/AvatarUpload';
export { default as BrandLogo } from './shared/BrandLogo';
export { default as EmptyState } from './shared/EmptyState';
export { default as ErrorBoundary } from './shared/ErrorBoundary';
export { default as HumanCard } from './shared/HumanCard';
export { default as HumanSkeleton } from './shared/HumanSkeleton';
export { default as ImageUpload } from './shared/ImageUpload';
export { default as LoadingSpinner } from './shared/LoadingSpinner';
export { default as NotFoundPage } from './shared/NotFoundPage';
export { default as PageHeader } from './shared/PageHeader';
export { default as PulseIndicator } from './shared/PulseIndicator';
export { default as ThemeToggle } from './shared/ThemeToggle';

// Root
export { ThemedApp } from './ThemedApp';
