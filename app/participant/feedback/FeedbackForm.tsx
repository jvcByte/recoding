'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Frown, Meh, Smile, Laugh, Heart } from 'lucide-react';

export default function FeedbackForm() {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [challenges, setChallenges] = useState('');
  const [improvements, setImprovements] = useState('');
  const [malfunctions, setMalfunctions] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ratingConfig = [
    { value: 1, icon: Frown, label: 'Poor', color: '#ef4444' },
    { value: 2, icon: Meh, label: 'Fair', color: '#f97316' },
    { value: 3, icon: Smile, label: 'Good', color: '#eab308' },
    { value: 4, icon: Laugh, label: 'Great', color: '#84cc16' },
    { value: 5, icon: Heart, label: 'Excellent', color: '#10b981' },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rating, 
          comments, 
          challenges, 
          improvements, 
          malfunctions,
          attachment_url: attachmentUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      router.push('/participant');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Rating */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Overall Experience</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', padding: '1.5rem 0' }}>
          {ratingConfig.map(({ value, icon: Icon, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="btn"
              style={{
                width: 80,
                height: 80,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                background: rating === value ? `${color}15` : 'var(--bg3)',
                border: rating === value ? `2px solid ${color}` : '1px solid var(--border)',
                color: rating === value ? color : 'var(--text3)',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={28} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenges */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Challenges Encountered</span>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          placeholder="Describe any difficulties you faced during the exercise..."
          style={{ border: 'none', background: 'var(--bg2)' }}
        />
      </div>

      {/* Malfunctions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Bugs & Technical Issues</span>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          value={malfunctions}
          onChange={(e) => setMalfunctions(e.target.value)}
          placeholder="Report any errors, crashes, or unexpected behavior..."
          style={{ border: 'none', background: 'var(--bg2)' }}
        />
      </div>

      {/* Improvements */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Suggested Improvements</span>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="Share your ideas for making the platform better..."
          style={{ border: 'none', background: 'var(--bg2)' }}
        />
      </div>

      {/* Additional Comments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Additional Comments</span>
          <span className="badge badge-gray">Optional</span>
        </div>
        <textarea
          className="form-textarea"
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Any other feedback you'd like to share..."
          style={{ border: 'none', background: 'var(--bg2)' }}
        />
      </div>

      {/* Attachment */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Supporting Document</span>
          <span className="badge badge-gray">Optional</span>
        </div>
        <input
          type="url"
          className="form-input"
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          placeholder="Paste a link to a screenshot or document (Google Drive, Imgur, etc.)"
          style={{ border: 'none', background: 'var(--bg2)' }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
        <button type="button" onClick={() => router.push('/participant')} className="btn btn-ghost btn-lg">
          Cancel
        </button>
      </div>
    </form>
  );
}
