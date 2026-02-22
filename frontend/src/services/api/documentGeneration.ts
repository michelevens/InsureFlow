import { api, API_URL } from './client';

export type TemplateType =
  | 'quote_comparison' | 'proposal' | 'binder_letter' | 'certificate_of_insurance'
  | 'dec_page' | 'endorsement' | 'cancellation_notice' | 'renewal_offer' | 'invoice';

export interface GeneratedDocument {
  id: number;
  documentable_type: string;
  documentable_id: number;
  template_type: TemplateType;
  file_path: string;
  file_name: string;
  file_size: number | null;
  metadata: Record<string, unknown> | null;
  generated_by: number | null;
  generated_by_user?: { id: number; name: string };
  created_at: string;
}

export const documentGenerationService = {
  async templates(): Promise<Record<string, string>> {
    return api.get('/documents/generate/templates');
  },

  async generate(templateType: TemplateType, entityType: string, entityId: number, extraData?: Record<string, unknown>): Promise<GeneratedDocument> {
    return api.post<GeneratedDocument>(`/documents/generate/${templateType}`, {
      entity_type: entityType,
      entity_id: entityId,
      extra_data: extraData,
    });
  },

  downloadUrl(id: number): string {
    return `${API_URL}/documents/generated/${id}/download`;
  },

  async list(params?: { entity_type?: string; entity_id?: number; template_type?: string }): Promise<GeneratedDocument[]> {
    const query = new URLSearchParams();
    if (params?.entity_type) query.set('entity_type', params.entity_type);
    if (params?.entity_id) query.set('entity_id', String(params.entity_id));
    if (params?.template_type) query.set('template_type', params.template_type);
    return api.get<GeneratedDocument[]>(`/documents/generated?${query}`);
  },

  async remove(id: number): Promise<void> {
    return api.delete(`/documents/generated/${id}`);
  },
};
