import { api } from './client';

export interface JobPosting {
  id: number;
  agency_id: number;
  agency_name?: string;
  title: string;
  description: string;
  requirements: string[];
  compensation: { type: string; base?: number; commission_rate?: number; benefits?: string[] };
  location: string;
  is_remote: boolean;
  status: 'draft' | 'published' | 'closed';
  applications_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: number;
  job_posting_id: number;
  job_title?: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  resume_path: string | null;
  cover_letter: string | null;
  experience: { years: number; specialties: string[]; licenses: string[] };
  status: 'submitted' | 'reviewing' | 'interview' | 'offered' | 'hired' | 'rejected';
  notes: string | null;
  created_at: string;
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const recruitmentService = {
  listPostings: (params?: { status?: string }) =>
    api.get<JobPosting[]>(`/recruitment/postings${qs(params)}`),
  getPosting: (id: number) => api.get<JobPosting>(`/recruitment/postings/${id}`),
  createPosting: (data: Partial<JobPosting>) =>
    api.post<JobPosting>('/recruitment/postings', data),
  updatePosting: (id: number, data: Partial<JobPosting>) =>
    api.put<JobPosting>(`/recruitment/postings/${id}`, data),
  deletePosting: (id: number) => api.delete(`/recruitment/postings/${id}`),

  listApplications: (postingId: number) =>
    api.get<JobApplication[]>(`/recruitment/postings/${postingId}/applications`),
  getApplication: (id: number) =>
    api.get<JobApplication>(`/recruitment/applications/${id}`),
  updateApplication: (id: number, data: Partial<{ status: string; notes: string }>) =>
    api.put<JobApplication>(`/recruitment/applications/${id}`, data),

  browseJobs: (params?: { location?: string; is_remote?: boolean }) =>
    api.get<JobPosting[]>(`/recruitment/jobs${qs(params)}`),
  applyToJob: (postingId: number, data: FormData) =>
    api.upload<JobApplication>(`/recruitment/jobs/${postingId}/apply`, data),
};
