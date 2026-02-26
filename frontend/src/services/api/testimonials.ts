import { api } from './client';

export interface Testimonial {
  id: number;
  user_id: number | null;
  name: string;
  role: string | null;
  company: string | null;
  rating: number;
  content: string;
  photo_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

interface PublishedResponse {
  testimonials: Testimonial[];
}

interface PaginatedResponse {
  data: Testimonial[];
  current_page: number;
  last_page: number;
  total: number;
}

interface SubmitPayload {
  rating: number;
  content: string;
  role?: string;
  company?: string;
}

export const testimonialService = {
  /** Public: fetch published testimonials for landing page */
  async getPublished(): Promise<Testimonial[]> {
    const res = await api.get<PublishedResponse>('/testimonials');
    return res.testimonials;
  },

  /** Authenticated: submit feedback */
  async submit(data: SubmitPayload): Promise<{ message: string; testimonial: Testimonial }> {
    return api.post('/testimonials', data);
  },

  /** Admin: list all testimonials */
  async adminList(status?: 'published' | 'pending'): Promise<PaginatedResponse> {
    const query = status ? `?status=${status}` : '';
    return api.get<PaginatedResponse>(`/admin/testimonials${query}`);
  },

  /** Admin: toggle publish */
  async togglePublish(id: number): Promise<{ message: string; testimonial: Testimonial }> {
    return api.put(`/admin/testimonials/${id}/toggle-publish`);
  },

  /** Admin: update testimonial */
  async update(id: number, data: Partial<SubmitPayload & { name: string }>): Promise<{ message: string; testimonial: Testimonial }> {
    return api.put(`/admin/testimonials/${id}`, data);
  },

  /** Admin: delete testimonial */
  async delete(id: number): Promise<{ message: string }> {
    return api.delete(`/admin/testimonials/${id}`);
  },
};
