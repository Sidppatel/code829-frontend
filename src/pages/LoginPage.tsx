import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle, Bug } from "lucide-react";
import { useAuthStore, type UserRole } from "../stores/authStore";
import MagneticButton from "../components/MagneticButton";
import apiClient from "../lib/axios";

// ---------------------------------------------------------------------------
// Dev role presets — emails must match backend dev-login config
// ---------------------------------------------------------------------------
interface DevPreset {
  label: string;
  description: string;
  email: string;
  redirectTo: string;
}

const DEV_PRESETS: DevPreset[] = [
  {
    label: "Developer",
    description: "Full dev access",
    email: "developer@code829.local",
    redirectTo: "/developer",
  },
  {
    label: "Admin",
    description: "Full platform access",
    email: "admin@code829.local",
    redirectTo: "/admin",
  },
  {
    label: "Staff",
    description: "Event management",
    email: "staff@code829.local",
    redirectTo: "/admin",
  },
  {
    label: "User",
    description: "Browse & book events",
    email: "user@code829.local",
    redirectTo: "/events",
  },
];

const ROLE_REDIRECTS: Partial<Record<UserRole, string>> = {
  admin: "/admin",
  organizer: "/admin",
  staff: "/admin",
  developer: "/developer",
  attendee: "/events",
  guest: "/events",
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function LoginPage(): React.ReactElement {
  const { isAuthenticated, devLogin, login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleMagicLink(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiClient.post("/auth/magic-link", { email });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  async function handleDevLogin(preset: DevPreset): Promise<void> {
    setDevLoading(preset.email);
    try {
      await devLogin(preset.email);
      const user = useAuthStore.getState().user;
      const redirect =
        (user?.role ? ROLE_REDIRECTS[user.role] : null) ?? preset.redirectTo;
      navigate(redirect, { replace: true });
    } catch {
      // Offline fallback — issue a synthetic token so local dev still works
      login(`dev-token-${preset.email}-${Date.now()}`, {
        id: preset.email,
        email: preset.email,
        firstName: 'Dev',
        lastName: preset.label,
        role: "developer" as UserRole,
        hasCompletedOnboarding: true,
      });
      navigate(preset.redirectTo, { replace: true });
    } finally {
      setDevLoading(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Login — Code829</title>
      </Helmet>

      <main
        style={{
          minHeight: "100vh",
          paddingTop: "64px",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-30%",
              right: "-20%",
              width: "70vw",
              height: "70vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 12%, transparent) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              left: "-15%",
              width: "55vw",
              height: "55vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 10%, transparent) 0%, transparent 70%)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "440px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center" }}>
            <Link
              to="/"
              style={{
                display: "inline-block",
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--accent-primary)",
                textDecoration: "none",
              }}
            >
              Code829
            </Link>
            <p
              style={{
                color: "var(--text-secondary)",
                marginTop: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              Sign in to access your tickets and bookings
            </p>
          </div>

          {/* Magic link card */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "var(--shadow-card-hover)",
            }}
          >
            {!submitted ? (
              <>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  Magic Link Sign In
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  Enter your email and we'll send a sign-in link. No password
                  needed.
                </p>

                <form
                  onSubmit={(e) => {
                    void handleMagicLink(e);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      background: "var(--bg-primary)",
                      border: "1.5px solid var(--border)",
                      borderRadius: "0.75rem",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <Mail
                      size={16}
                      style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "0.95rem",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                      }}
                    />
                  </div>

                  <MagneticButton
                    type="submit"
                    disabled={loading || !email.trim()}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {loading ? (
                      "Sending…"
                    ) : (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        Send Magic Link <ArrowRight size={16} />
                      </span>
                    )}
                  </MagneticButton>
                </form>

                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--text-tertiary)",
                    marginTop: "1rem",
                  }}
                >
                  By signing in you agree to our{" "}
                  <span
                    style={{
                      color: "var(--accent-primary)",
                      cursor: "pointer",
                    }}
                  >
                    Terms
                  </span>{" "}
                  and{" "}
                  <span
                    style={{
                      color: "var(--accent-primary)",
                      cursor: "pointer",
                    }}
                  >
                    Privacy Policy
                  </span>
                </p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <CheckCircle
                  size={48}
                  style={{
                    color: "var(--color-success)",
                    margin: "0 auto 1rem",
                    display: "block",
                  }}
                />
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Check your email!
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  We sent a magic link to{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {email}
                  </strong>
                  . Click it to sign in.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>

          {/* Dev login panel — only shown in DEV mode */}
          {import.meta.env.DEV && (
            <div
              style={{
                background:
                  "color-mix(in srgb, var(--color-warning) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
                borderRadius: "1.25rem",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Bug size={16} style={{ color: "var(--color-warning)" }} />
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--color-warning)",
                    margin: 0,
                  }}
                >
                  Dev Quick Login
                </h3>
                <span
                  style={{
                    fontSize: "0.65rem",
                    background: "var(--color-warning)",
                    color: "var(--bg-primary)",
                    padding: "0.1rem 0.4rem",
                    borderRadius: "4px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  DEV ONLY
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.6rem",
                }}
              >
                {DEV_PRESETS.map((preset) => {
                  const isLoading = devLoading === preset.email;
                  return (
                    <button
                      key={preset.email}
                      onClick={() => {
                        void handleDevLogin(preset);
                      }}
                      disabled={devLoading !== null}
                      style={{
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.75rem",
                        border:
                          "1px solid color-mix(in srgb, var(--color-warning) 40%, transparent)",
                        background: isLoading
                          ? "var(--color-warning)"
                          : "color-mix(in srgb, var(--color-warning) 10%, transparent)",
                        color: isLoading
                          ? "var(--bg-primary)"
                          : "var(--color-warning)",
                        cursor: devLoading !== null ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-body)",
                        textAlign: "left",
                        opacity: devLoading !== null && !isLoading ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        {isLoading ? "Logging in…" : preset.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.8,
                          marginTop: "0.15rem",
                        }}
                      >
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
