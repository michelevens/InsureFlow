import { api, API_URL } from './client';

export interface InsuranceDocument {
  id: string;
  documentable_type: string;
  documentable_id: number;
  uploaded_by: number;
  type: string;
  title: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  uploader?: { id: number; name: string };
}

export interface SignatureRequest {
  id: string;
  signable_type: string;
  signable_id: number;
  signer_role: string;
  signer_name: string;
  signer_email: string;
  signer_id: number | null;
  requested_by: number | null;
  status: 'requested' | 'signed' | 'rejected' | 'cancelled';
  signature_data: string | null;
  ip_address: string | null;
  request_message: string | null;
  rejection_reason: string | null;
  requested_at: string | null;
  signed_at: string | null;
  rejected_at: string | null;
  created_at: string;
  requester?: { id: number; name: string };
}

export const documentService = {
  async getDocuments(entityType: string, entityId: number): Promise<{ documents: InsuranceDocument[] }> {
    return api.get(`/documents?entity_type=${entityType}&entity_id=${entityId}`);
  },

  async uploadDocument(data: {
    file: File;
    entity_type: string;
    entity_id: number;
    type: string;
    title?: string;
  }): Promise<{ message: string; document: InsuranceDocument }> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('entity_type', data.entity_type);
    formData.append('entity_id', String(data.entity_id));
    formData.append('type', data.type);
    if (data.title) formData.append('title', data.title);
    return api.upload('/documents', formData);
  },

  getDownloadUrl(documentId: string): string {
    const token = localStorage.getItem('auth_token');
    return `${API_URL}/documents/${documentId}/download?token=${token}`;
  },

  async deleteDocument(documentId: string): Promise<void> {
    return api.delete(`/documents/${documentId}`);
  },
};

export const signatureService = {
  async getMyPending(): Promise<{ signatures: SignatureRequest[] }> {
    return api.get('/signatures/pending');
  },

  async getForApplication(applicationId: number): Promise<{ signatures: SignatureRequest[] }> {
    return api.get(`/applications/${applicationId}/signatures`);
  },

  async requestSignature(applicationId: number, data: {
    signer_name: string;
    signer_email: string;
    signer_role: string;
    message?: string;
  }): Promise<SignatureRequest> {
    return api.post(`/applications/${applicationId}/signatures`, data);
  },

  async sign(signatureId: string, signatureData: string): Promise<SignatureRequest> {
    return api.put(`/signatures/${signatureId}/sign`, { signature_data: signatureData });
  },

  async reject(signatureId: string, reason?: string): Promise<SignatureRequest> {
    return api.put(`/signatures/${signatureId}/reject`, { reason });
  },
};
