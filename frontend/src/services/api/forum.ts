import { api } from './client';

export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  topic_count: number;
}

export interface ForumTopic {
  id: number;
  category_id: number;
  author_id: number;
  author_name?: string;
  title: string;
  slug: string;
  body: string;
  view_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_reply_at: string | null;
  created_at: string;
}

export interface ForumPost {
  id: number;
  topic_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  is_solution: boolean;
  upvote_count: number;
  user_vote?: 'upvote' | 'downvote' | null;
  created_at: string;
}

export const forumService = {
  getCategories: () => api.get<ForumCategory[]>('/forum/categories'),
  getTopics: (categorySlug: string, page = 1) =>
    api.get<{ data: ForumTopic[]; last_page: number }>(`/forum/categories/${categorySlug}/topics?page=${page}`),
  getTopic: (topicSlug: string) =>
    api.get<{ topic: ForumTopic; posts: ForumPost[] }>(`/forum/topics/${topicSlug}`),
  createTopic: (data: { category_id: number; title: string; body: string }) =>
    api.post<ForumTopic>('/forum/topics', data),
  createPost: (topicId: number, data: { content: string }) =>
    api.post<ForumPost>(`/forum/topics/${topicId}/posts`, data),
  vote: (postId: number, type: 'upvote' | 'downvote') =>
    api.post<{ upvote_count: number }>(`/forum/posts/${postId}/vote`, { type }),
  markSolution: (postId: number) =>
    api.put<ForumPost>(`/forum/posts/${postId}/solution`),
};
