import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button } from '@/components/ui';
import { helpCenterService } from '@/services/api';
import type { HelpCategory, HelpArticle } from '@/services/api/helpCenter';
import {
  HelpCircle, Search, ChevronRight, ThumbsUp, ThumbsDown, ArrowLeft, BookOpen,
} from 'lucide-react';

type View = 'categories' | 'articles' | 'article';

export default function HelpCenter() {
  const [view, setView] = useState<View>('categories');
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);

  useEffect(() => {
    helpCenterService.getCategories().then(setCategories).catch(() => { toast.error('Failed to load help categories'); }).finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setLoading(true);
    try {
      const results = await helpCenterService.search(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openCategory = async (cat: HelpCategory) => {
    setActiveCategory(cat);
    setView('articles');
    setLoading(true);
    try {
      const arts = await helpCenterService.getArticlesByCategory(cat.slug);
      setArticles(arts);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (slug: string) => {
    setLoading(true);
    try {
      const art = await helpCenterService.getArticle(slug);
      setArticle(art);
      setView('article');
    } catch {
      toast.error('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const vote = async (articleId: number, helpful: boolean) => {
    try {
      await helpCenterService.voteHelpful(articleId, helpful);
      toast.success('Thank you for your feedback!');
      if (article && article.id === articleId) {
        setArticle({
          ...article,
          helpful_count: helpful ? article.helpful_count + 1 : article.helpful_count,
          not_helpful_count: !helpful ? article.not_helpful_count + 1 : article.not_helpful_count,
        });
      }
    } catch {
      toast.error('Failed to submit your vote');
    }
  };

  const goBack = () => {
    if (view === 'article') { setView('articles'); setArticle(null); }
    else if (view === 'articles') { setView('categories'); setActiveCategory(null); }
  };

  const categoryIcons: Record<string, string> = {
    'getting-started': '🚀',
    'account': '👤',
    'billing': '💳',
    'agents': '🤝',
    'policies': '📋',
    'claims': '⚠️',
    'api': '🔌',
    'security': '🔒',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Find answers and learn how to use Insurons</p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:ring-2 focus:ring-shield-500 dark:focus:ring-shield-400 focus:border-shield-500"
            />
          </div>
          <Button variant="shield" onClick={handleSearch}>Search</Button>
        </div>
      </Card>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
            <button onClick={() => { setSearchResults(null); setSearchQuery(''); }} className="text-sm text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">Clear</button>
          </div>
          {searchResults.map(art => (
            <Card key={art.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => openArticle(art.slug)}>
              <h3 className="font-medium text-slate-900 dark:text-white">{art.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{art.excerpt}</p>
              <div className="flex items-center gap-2 mt-2">
                {art.category_name && <Badge variant="default">{art.category_name}</Badge>}
                <span className="text-xs text-slate-400 dark:text-slate-500">{art.view_count} views</span>
              </div>
            </Card>
          ))}
          {searchResults.length === 0 && (
            <Card className="p-8 text-center">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400">No articles found</p>
            </Card>
          )}
        </div>
      ) : loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : view === 'categories' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Card
              key={cat.id}
              className="p-5 cursor-pointer hover:shadow-md transition-all group"
              onClick={() => openCategory(cat)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[cat.slug] || '📁'}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-shield-600 dark:text-shield-400 transition-colors">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.description}</p>}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-shield-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{cat.article_count} article{cat.article_count !== 1 ? 's' : ''}</p>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card className="p-12 text-center col-span-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Help center is being set up</p>
            </Card>
          )}
        </div>
      ) : view === 'articles' ? (
        <div className="space-y-3">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">
            <ArrowLeft className="w-4 h-4" /> Back to categories
          </button>
          {activeCategory && (
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{categoryIcons[activeCategory.slug] || '📁'}</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeCategory.name}</h2>
            </div>
          )}
          {articles.map(art => (
            <Card key={art.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => openArticle(art.slug)}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{art.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{art.excerpt}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                <span>{art.view_count} views</span>
                <span>{art.helpful_count} found helpful</span>
                {art.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </Card>
          ))}
          {articles.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-slate-400 dark:text-slate-500">No articles in this category yet</p>
            </Card>
          )}
        </div>
      ) : view === 'article' && article ? (
        <div className="space-y-4">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-shield-600 dark:text-shield-400 hover:text-shield-700 dark:text-shield-300">
            <ArrowLeft className="w-4 h-4" /> Back to articles
          </button>
          <Card className="p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{article.title}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-6">
              {article.category_name && <Badge variant="default">{article.category_name}</Badge>}
              <span>{article.view_count} views</span>
              <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {article.content_markdown}
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                {article.tags.map(tag => (
                  <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </Card>

          {/* Helpful? */}
          <Card className="p-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Was this article helpful?</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => vote(article.id, true)}>
                <ThumbsUp className="w-4 h-4 mr-1" /> Yes ({article.helpful_count})
              </Button>
              <Button variant="outline" size="sm" onClick={() => vote(article.id, false)}>
                <ThumbsDown className="w-4 h-4 mr-1" /> No ({article.not_helpful_count})
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
