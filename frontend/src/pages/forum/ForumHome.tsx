import { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { forumService } from '@/services/api';
import type { ForumCategory, ForumTopic, ForumPost } from '@/services/api/forum';
import {
  MessageCircle, Eye, ChevronRight, ArrowLeft, Plus, ThumbsUp, CheckCircle, Pin,
} from 'lucide-react';

type View = 'categories' | 'topics' | 'topic';

export default function ForumHome() {
  const [view, setView] = useState<View>('categories');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeCategory, setActiveCategory] = useState<ForumCategory | null>(null);
  const [activeTopic, setActiveTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    forumService.getCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openCategory = async (cat: ForumCategory) => {
    setActiveCategory(cat);
    setView('topics');
    setLoading(true);
    try {
      const result = await forumService.getTopics(cat.slug);
      setTopics(result.data);
    } catch {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const openTopic = async (topic: ForumTopic) => {
    setLoading(true);
    try {
      const result = await forumService.getTopic(topic.slug);
      setActiveTopic(result.topic);
      setPosts(result.posts);
      setView('topic');
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!activeTopic || !replyContent.trim()) return;
    setSubmitting(true);
    try {
      const newPost = await forumService.createPost(activeTopic.id, { content: replyContent });
      setPosts(prev => [...prev, newPost]);
      setReplyContent('');
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: number) => {
    try {
      const result = await forumService.vote(postId, 'upvote');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvote_count: result.upvote_count } : p));
    } catch {
      // handle error
    }
  };

  const handleMarkSolution = async (postId: number) => {
    try {
      await forumService.markSolution(postId);
      setPosts(prev => prev.map(p => ({ ...p, is_solution: p.id === postId })));
    } catch {
      // handle error
    }
  };

  const goBack = () => {
    if (view === 'topic') { setView('topics'); setActiveTopic(null); setPosts([]); }
    else if (view === 'topics') { setView('categories'); setActiveCategory(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Forum</h1>
          <p className="text-slate-500 mt-1">Connect, share knowledge, and learn from peers</p>
        </div>
        {view === 'topics' && (
          <Button variant="shield" onClick={() => setShowNewTopic(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Topic
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : view === 'categories' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => (
            <Card key={cat.id} className="p-5 cursor-pointer hover:shadow-md transition-all group" onClick={() => openCategory(cat)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-shield-50 flex items-center justify-center text-lg">
                    {cat.icon || '💬'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-shield-600 transition-colors">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{cat.topic_count} topics</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card className="p-12 text-center col-span-2">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Forum is being set up</p>
            </Card>
          )}
        </div>
      ) : view === 'topics' ? (
        <div className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-shield-600 hover:text-shield-700">
            <ArrowLeft className="w-4 h-4" /> Back to categories
          </button>
          {activeCategory && <h2 className="text-xl font-bold text-slate-900">{activeCategory.name}</h2>}
          {topics.map(topic => (
            <Card key={topic.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => openTopic(topic)}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {topic.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                    <h3 className="font-medium text-slate-900">{topic.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">by {topic.author_name} • {new Date(topic.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {topic.reply_count}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {topic.view_count}</span>
                </div>
              </div>
            </Card>
          ))}
          {topics.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-400">No topics yet. Start the conversation!</p>
            </Card>
          )}
        </div>
      ) : view === 'topic' && activeTopic ? (
        <div className="space-y-4">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-shield-600 hover:text-shield-700">
            <ArrowLeft className="w-4 h-4" /> Back to topics
          </button>

          {/* Topic header */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{activeTopic.title}</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
              <span>by {activeTopic.author_name}</span>
              <span>{new Date(activeTopic.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {activeTopic.view_count}</span>
            </div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{activeTopic.body}</div>
          </Card>

          {/* Posts */}
          {posts.map(post => (
            <Card key={post.id} className={`p-5 ${post.is_solution ? 'border-green-200 bg-green-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-900 text-sm">{post.author_name}</span>
                    <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString()}</span>
                    {post.is_solution && <Badge variant="success">Solution</Badge>}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => handleVote(post.id)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-shield-600">
                      <ThumbsUp className="w-3.5 h-3.5" /> {post.upvote_count}
                    </button>
                    {!post.is_solution && (
                      <button onClick={() => handleMarkSolution(post.id)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as solution
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Reply */}
          {!activeTopic.is_locked && (
            <Card className="p-4">
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                className="w-full h-24 text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500 mb-3"
                placeholder="Write a reply..."
              />
              <div className="flex justify-end">
                <Button variant="shield" onClick={handleReply} disabled={submitting || !replyContent.trim()}>
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {/* New Topic modal */}
      {showNewTopic && activeCategory && (
        <NewTopicModal
          categoryId={activeCategory.id}
          onClose={() => setShowNewTopic(false)}
          onCreated={(topic) => { setTopics(prev => [topic, ...prev]); setShowNewTopic(false); }}
        />
      )}
    </div>
  );
}

function NewTopicModal({ categoryId, onClose, onCreated }: { categoryId: number; onClose: () => void; onCreated: (t: ForumTopic) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title || !body) return;
    setSaving(true);
    try {
      const topic = await forumService.createTopic({ category_id: categoryId, title, body });
      onCreated(topic);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Topic" size="md">
      <div className="space-y-4">
        <Input label="Title" placeholder="What's your question or topic?" value={title} onChange={e => setTitle(e.target.value)} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Body</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full h-32 text-sm border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-shield-500 focus:border-shield-500"
            placeholder="Describe your question or share your thoughts..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="shield" onClick={handleSubmit} disabled={saving || !title || !body}>
            {saving ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
