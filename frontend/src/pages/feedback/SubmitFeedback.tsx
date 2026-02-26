import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { testimonialService } from '@/services/api/testimonials';
import { Card, Button, Input } from '@/components/ui';
import { Star, Send, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

export default function SubmitFeedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (content.trim().length < 10) {
      toast.error('Please write at least 10 characters of feedback');
      return;
    }

    setSubmitting(true);
    try {
      await testimonialService.submit({
        rating,
        content: content.trim(),
        role: role.trim() || undefined,
        company: company.trim() || undefined,
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <Card>
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feedback Submitted!</h2>
            <p className="text-slate-500 dark:text-slate-400">
              Your feedback has been received and is pending review. Once approved, it will be published on our website.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setRating(0); setContent(''); }}>
              Submit Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Share Your Experience</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Your feedback helps others discover Insurons. Approved reviews are featured on our website.
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User info preview */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-shield-100 dark:bg-shield-900/40 flex items-center justify-center text-shield-700 dark:text-shield-300 font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>

            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                How would you rate your experience? *
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 self-center">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Feedback text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Your feedback *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell us about your experience with Insurons — what you liked, how it helped you, or what could be improved..."
                rows={5}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-shield-500/30 dark:focus:ring-shield-400/30 focus:border-shield-500 dark:focus:border-shield-400 transition-all resize-none"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 text-right">
                {content.length}/1000
              </p>
            </div>

            {/* Optional fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Your Title / Role (optional)"
                placeholder="e.g. Agency Owner, Insurance Agent"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <Input
                label="Company (optional)"
                placeholder="e.g. Apex Insurance Group"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <Button
                type="submit"
                variant="shield"
                disabled={submitting || rating === 0 || content.trim().length < 10}
                leftIcon={submitting ? undefined : <Send className="w-4 h-4" />}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                <MessageSquarePlus className="w-3.5 h-3.5 inline mr-1" />
                Your feedback will be reviewed before publishing
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
