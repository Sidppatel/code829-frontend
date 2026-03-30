import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Ticket, QrCode, CheckCircle } from 'lucide-react';
import { bookingsApi } from '../services/bookingsApi';

interface InvitationData {
  eventTitle: string;
  eventDate: string;
  seatLabel: string | null;
  ticketType: string;
  guestName: string | null;
  qrToken: string;
  isCheckedIn: boolean;
  bookingNumber: string;
}

export default function InvitationPage(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await bookingsApi.getInvitation<InvitationData>(token!);
        if (!cancelled) setData(res.data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid or expired invitation';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>
        <Helmet><title>Invalid Invitation — Code829</title></Helmet>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            Invalid Invitation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{error ?? 'This invitation link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Your Ticket — {data.eventTitle} — Code829</title></Helmet>
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', padding: '2rem',
      }}>
        <div style={{
          maxWidth: 400, width: '100%', borderRadius: '1.25rem',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cta))',
            color: '#fff', textAlign: 'center',
          }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
              {data.eventTitle}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.875rem', opacity: 0.9 }}>
              <Calendar size={14} />
              {new Date(data.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {data.guestName && (
              <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Welcome, {data.guestName}!
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{
                padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)',
                fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}>
                <Ticket size={14} /> {data.ticketType}
              </div>
              {data.seatLabel && (
                <div style={{
                  padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'var(--bg-tertiary)',
                  fontSize: '0.8125rem', color: 'var(--text-secondary)',
                }}>
                  Seat: {data.seatLabel}
                </div>
              )}
            </div>

            {/* QR Code */}
            {data.isCheckedIn ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
                <div style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--color-success)' }}>Already Checked In</div>
              </div>
            ) : (
              <div style={{
                padding: '1rem', background: '#fff', borderRadius: '0.75rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
              }}>
                <QrCode size={120} style={{ color: '#000' }} />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#666',
                  wordBreak: 'break-all', textAlign: 'center', maxWidth: '200px',
                }}>
                  {data.qrToken}
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Booking #{data.bookingNumber}
              <br />
              Show this QR code at the venue for check-in
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
