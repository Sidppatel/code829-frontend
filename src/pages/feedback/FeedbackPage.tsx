import { useState } from 'react';
import { Card, Input, Button, Rate, Radio, App, Result, Typography } from 'antd';
import {
  SmileOutlined,
  BugOutlined,
  BulbOutlined,
  HeartOutlined,
  FrownOutlined,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { feedbackApi } from '../../services/feedbackApi';
import { useAuthStore } from '../../stores/authStore';
import PageHeader from '../../components/shared/PageHeader';

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
      setSubmitted(true);
    } catch {
      message.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
        <Result
          icon={<SmileOutlined style={{ color: 'var(--accent-violet)' }} />}
          title="Thanks for your feedback!"
          subTitle="We appreciate you taking the time to help us improve."
          extra={
            <Button type="primary" onClick={() => {
              setSubmitted(false);
              setBody('');
              setRating(0);
              setType('General');
            }}>
              Submit Another
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageHeader
        title="Send Feedback"
        subtitle="Help us improve your experience"
      />

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 24 } }}>
        {/* Feedback Type */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            What kind of feedback?
          </label>
          <Radio.Group
            value={type}
            onChange={(e) => setType(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="middle"
          >
            {feedbackTypes.map((t) => (
              <Radio.Button key={t.value} value={t.value} style={{ borderRadius: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {t.icon} {t.label}
                </span>
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            How would you rate your experience?
          </label>
          <Rate
            value={rating}
            onChange={setRating}
            style={{ fontSize: 28 }}
          />
          {rating === 0 && (
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
              Optional — tap to rate
            </Typography.Text>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
            Your Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            maxLength={100}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
            Email <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional — if you want us to follow up)</span>
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            maxLength={256}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
            Your Message *
          </label>
          <Input.TextArea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell us what you think..."
            rows={5}
            maxLength={2000}
            showCount
          />
        </div>

        {/* Submit */}
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={submitting}
          block
          style={{ borderRadius: 10, height: 44 }}
        >
          Submit Feedback
        </Button>
      </Card>
    </div>
  );
}
