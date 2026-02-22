import { api } from './client';

export interface HelpCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  article_count: number;
}

export interface HelpArticle {
  id: number;
  category_id: number;
  category_name?: string;
  title: string;
  slug: string;
  excerpt: string;
  content_markdown: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const helpCenterService = {
  getCategories: () => api.get<HelpCategory[]>('/help/categories'),
  getArticlesByCategory: (slug: string) =>
    api.get<HelpArticle[]>(`/help/categories/${slug}/articles`),
  getArticle: (slug: string) => api.get<HelpArticle>(`/help/articles/${slug}`),
  search: (query: string) =>
    api.get<HelpArticle[]>(`/help/search?q=${encodeURIComponent(query)}`),
  voteHelpful: (articleId: number, helpful: boolean) =>
    api.post(`/help/articles/${articleId}/vote`, { helpful }),

  listArticles: (params?: { category_id?: number; is_published?: boolean }) =>
    api.get<HelpArticle[]>(`/admin/help/articles${qs(params)}`),
  createArticle: (data: Partial<HelpArticle>) =>
    api.post<HelpArticle>('/admin/help/articles', data),
  updateArticle: (id: number, data: Partial<HelpArticle>) =>
    api.put<HelpArticle>(`/admin/help/articles/${id}`, data),
  deleteArticle: (id: number) => api.delete(`/admin/help/articles/${id}`),

  createCategory: (data: Partial<HelpCategory>) =>
    api.post<HelpCategory>('/admin/help/categories', data),
  updateCategory: (id: number, data: Partial<HelpCategory>) =>
    api.put<HelpCategory>(`/admin/help/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/help/categories/${id}`),
};
