import { useState, useEffect, useCallback } from 'react';
import { testimonialService, type Testimonial } from '@/services/api/testimonials';
import { Card, Button, Badge } from '@/components/ui';
import { Star, Eye, EyeOff, Trash2, Edit3, X, Check, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'all' | 'published' | 'pending';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const res = await testimonialService.adminList(status);
      setTestimonials(res.data);
    } catch {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadTestimonials(); }, [loadTestimonials]);

  const handleTogglePublish = async (t: Testimonial) => {
    try {
      const res = await testimonialService.togglePublish(t.id);
      setTestimonials(prev => prev.map(item =>
        item.id === t.id ? res.testimonial : item
      ));
      toast.success(res.message);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this testimonial permanently?')) return;
    try {
      await testimonialService.delete(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Testimonial deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const res = await testimonialService.update(id, { content: editContent });
      setTestimonials(prev => prev.map(t => t.id === id ? res.testimonial : t));
      setEditingId(null);
      toast.success('Updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Published', value: 'published' },
    { label: 'Pending', value: 'pending' },
  ];

  const publishedCount = testimonials.filter(t => t.is_published).length;
  const pendingCount = testimonials.filter(t => !t.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Testimonials</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review, approve, and manage user feedback for the website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success">{publishedCount} published</Badge>
          <Badge variant="warning">{pendingCount} pending</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-shield-50 text-shield-700 dark:bg-shield-900/40 dark:text-shield-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin" />
        </div>
      ) : testimonials.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No testimonials yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <Card key={t.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-shield-100 dark:bg-shield-900/40 flex items-center justify-center text-shield-700 dark:text-shield-300 font-bold text-sm shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {[t.role, t.company].filter(Boolean).join(', ') || 'No title'}
                          {t.user && ` — ${t.user.email}`}
                        </p>
                      </div>
                      <div className="flex gap-0.5 ml-auto shrink-0">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        ))}
                      </div>
                    </div>

                    {editingId === t.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-shield-500/30 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="shield" onClick={() => handleSaveEdit(t.id)} leftIcon={<Check className="w-3.5 h-3.5" />}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} leftIcon={<X className="w-3.5 h-3.5" />}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        &ldquo;{t.content}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant={t.is_published ? 'success' : 'warning'}>
                        {t.is_published ? 'Published' : 'Pending'}
                      </Badge>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Submitted {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(t)}
                      className={`p-2 rounded-lg transition-colors ${
                        t.is_published
                          ? 'hover:bg-amber-50 text-amber-600 dark:hover:bg-amber-900/20 dark:text-amber-400'
                          : 'hover:bg-green-50 text-green-600 dark:hover:bg-green-900/20 dark:text-green-400'
                      }`}
                      title={t.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {t.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditingId(t.id); setEditContent(t.content); }}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 dark:hover:bg-slate-800 dark:text-slate-400"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 dark:hover:bg-red-900/20 dark:text-slate-500 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
