import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Input, Button, Rate, App, Row, Col } from 'antd';
import {
  SmileOutlined,
  BugOutlined,
  BulbOutlined,
  HeartOutlined,
  FrownOutlined,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { feedbackApi } from '../../services/api';
import { useAuthStore } from '@code829/shared/stores/authStore';
import PagePreamble from '../../components/layout/PagePreamble';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Public/FeedbackPage');

const feedbackTypes = [
  { value: 'General', label: 'General', icon: <MessageOutlined /> },
  { value: 'Suggestion', label: 'Suggestion', icon: <BulbOutlined /> },
  { value: 'Bug', label: 'Bug Report', icon: <BugOutlined /> },
  { value: 'Compliment', label: 'Compliment', icon: <HeartOutlined /> },
  { value: 'Complaint', label: 'Complaint', icon: <FrownOutlined /> },
];

export default function FeedbackPage() {
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [type, setType] = useState('General');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { message.warning('Please enter your name'); return; }
    if (!body.trim() || body.trim().length < 10) { message.warning('Message must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      await feedbackApi.submit({
        name: name.trim(),
        email: email.trim() || undefined,
        type,
        message: body.trim(),
        rating,
      });
      log.info('Feedback submitted', { type, rating });
      setSubmitted(true);
    } catch (err) {
      log.error('Failed to submit feedback', err);
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: '24px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 500, width: '100%' }}
        >
          <Card className="glass-card" style={{ borderRadius: 24, textAlign: 'center' }} styles={{ body: { padding: 48 } }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              background: 'var(--bg-muted)',
              borderRadius: 99, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 32px',
              color: 'var(--accent-violet)',
              fontSize: 40,
            }}>
              <SmileOutlined />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Thank You!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
              Your feedback is invaluable. We've received your message and will use it to make the platform even better.
            </p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => {
                setSubmitted(false);
                setBody('');
                setRating(0);
                setType('General');
              }}
              style={{ 
                height: 54, 
                padding: '0 40px', 
                borderRadius: 12, 
                fontWeight: 700,
                background: 'var(--gradient-brand)',
                border: 'none',
                boxShadow: 'var(--shadow-hover)',
              }}
            >
              Submit Another
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  if (submitted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: '24px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 500, width: '100%' }}
        >
          <div className="glass-card" style={{ borderRadius: 36, textAlign: 'center', padding: 60, boxShadow: 'var(--card-shadow)' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              background: 'var(--bg-muted)',
              borderRadius: 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 32px',
              color: 'var(--accent-violet)',
              fontSize: 40,
            }}>
              <SmileOutlined />
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-1.5px' }}>Experience Recorded</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 40, lineHeight: 1.6, fontWeight: 500 }}>
              Your perspective is essential to our evolution. We've received your feedback and will use it to refine our standard of excellence.
            </p>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => {
                setSubmitted(false);
                setBody('');
                setRating(0);
                setType('General');
              }}
              style={{ 
                height: 60, 
                padding: '0 48px', 
                borderRadius: 16, 
                fontWeight: 800,
                background: 'var(--gradient-brand)',
                border: 'none',
                boxShadow: 'var(--shadow-hover)',
              }}
            >
              Share More
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      style={{ paddingBottom: 150 }}
    >
      <PagePreamble
        kicker="Curating perfection"
        title="Help us shape the next evening"
        subtitle="Every note you share sharpens the room we set tomorrow. Your feedback fuels the next curtain."
      />

      <div className="page-container">
        <Row justify="center">
          <Col xs={24} lg={18} xl={14}>
            <motion.div variants={itemVariants}>
              <div className="glass-card" style={{ padding: '60px 48px', borderRadius: 40, boxShadow: 'var(--card-shadow)' }}>
                {/* Feedback Type Selector */}
                <div style={{ marginBottom: 48 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24, color: 'var(--text-muted)' }}>
                    Selection Category
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {feedbackTypes.map((t) => (
                      <div
                        key={t.value}
                        onClick={() => setType(t.value)}
                        style={{
                          padding: '14px 24px',
                          borderRadius: 16,
                          cursor: 'pointer',
                          background: type === t.value ? 'var(--gradient-brand)' : 'var(--bg-soft)',
                          border: 'none',
                          color: type === t.value ? 'var(--text-on-brand)' : 'var(--text-primary)',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontWeight: 700,
                          fontSize: 14,
                          boxShadow: type === t.value ? 'var(--shadow-hover)' : 'none',
                          transform: type === t.value ? 'translateY(-2px)' : 'none'
                        }}
                      >
                        {t.icon} {t.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating Input */}
                <div style={{ marginBottom: 48 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24, color: 'var(--text-muted)' }}>
                    Global Satisfaction
                  </label>
                  <div style={{ 
                    background: 'var(--bg-soft)',
                    padding: '32px', 
                    borderRadius: 24, 
                    border: '1px solid var(--border)',
                    textAlign: 'center'
                  }}>
                    <Rate
                      value={rating}
                      onChange={setRating}
                      style={{ fontSize: 42, color: 'var(--accent-gold)' }}
                    />
                    <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {rating === 0 ? 'How would you rate your journey?' : `Excellence Level: ${rating} / 5`}
                    </div>
                  </div>
                </div>

                {/* Name & Email Grid */}
                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: 32 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, color: 'var(--text-muted)' }}>
                        Identify Yourself
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        style={{ 
                          height: 60, 
                          borderRadius: 18, 
                          background: 'var(--bg-soft)',
                          border: '1px solid var(--border)', 
                          color: 'var(--text-primary)',
                          fontSize: 16,
                          padding: '0 20px',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ marginBottom: 32 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, color: 'var(--text-muted)' }}>
                        Contact Point
                      </label>
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        type="email"
                        style={{ 
                          height: 60, 
                          borderRadius: 18, 
                          background: 'var(--bg-soft)',
                          border: '1px solid var(--border)', 
                          color: 'var(--text-primary)',
                          fontSize: 16,
                          padding: '0 20px',
                          fontWeight: 500
                        }}
                      />
                    </div>
                  </Col>
                </Row>

                {/* Feedback Message */}
                <div style={{ marginBottom: 48 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, color: 'var(--text-muted)' }}>
                    Detailed Perspective
                  </label>
                  <Input.TextArea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Elaborate on your experience or propose an evolution..."
                    rows={6}
                    style={{ 
                      borderRadius: 24, 
                      background: 'var(--bg-soft)',
                      border: '1px solid var(--border)', 
                      color: 'var(--text-primary)', 
                      padding: '24px',
                      fontSize: 16,
                      lineHeight: 1.6,
                      fontWeight: 500
                    }}
                  />
                </div>

                {/* Submit Action */}
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                  block
                  style={{ 
                    height: 72, 
                    borderRadius: 20, 
                    fontWeight: 900, 
                    fontSize: 18,
                    background: 'var(--gradient-brand)',
                    border: 'none',
                    boxShadow: 'var(--shadow-hover)',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                >
                  Post Feedback
                </Button>
              </div>
            </motion.div>
          </Col>
        </Row>
      </div>
    </motion.div>
  );
}
