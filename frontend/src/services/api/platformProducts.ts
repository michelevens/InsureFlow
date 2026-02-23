import { api } from './client';
import type { PlatformProduct, PlatformProductResponse, AgencyCarrierAppointment } from '../../types';

export const platformProductService = {
  // Public
  async getVisibleProducts(agencyId?: number): Promise<PlatformProductResponse> {
    const query = agencyId ? `?agency_id=${agencyId}` : '';
    return api.get<PlatformProductResponse>(`/products/visible${query}`);
  },

  // Admin
  async adminGetProducts(params?: { category?: string; search?: string }): Promise<PlatformProductResponse> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<PlatformProductResponse>(`/admin/products${qs ? `?${qs}` : ''}`);
  },

  async adminToggleProduct(productId: number): Promise<{ message: string; product: PlatformProduct }> {
    return api.put(`/admin/products/${productId}/toggle`);
  },

  async adminUpdateProduct(productId: number, data: Partial<PlatformProduct>): Promise<PlatformProduct> {
    return api.put(`/admin/products/${productId}`, data);
  },

  async adminBulkToggle(productIds: number[], isActive: boolean): Promise<{ message: string }> {
    return api.post('/admin/products/bulk-toggle', { product_ids: productIds, is_active: isActive });
  },

  async adminSyncProducts(): Promise<{ message: string }> {
    return api.post('/admin/products/sync');
  },

  // Agency Products
  async getAgencyProducts(): Promise<PlatformProductResponse> {
    return api.get<PlatformProductResponse>('/agency/products');
  },

  async updateAgencyProducts(productIds: number[]): Promise<{ message: string }> {
    return api.put('/agency/products', { product_ids: productIds });
  },

  async toggleAgencyProduct(productId: number): Promise<{ message: string; is_active: boolean }> {
    return api.put(`/agency/products/${productId}/toggle`);
  },

  // Agency Carrier Appointments
  async getAppointments(): Promise<AgencyCarrierAppointment[]> {
    return api.get('/agency/appointments');
  },

  async createAppointment(data: {
    carrier_id: number;
    platform_product_id: number;
    appointment_number?: string;
    effective_date?: string;
    termination_date?: string;
  }): Promise<AgencyCarrierAppointment> {
    return api.post('/agency/appointments', data);
  },

  async syncCarrierAppointments(carrierId: number, productIds: number[]): Promise<{ message: string }> {
    return api.put(`/agency/appointments/carrier/${carrierId}`, { product_ids: productIds });
  },

  async deleteAppointment(appointmentId: number): Promise<{ message: string }> {
    return api.delete(`/agency/appointments/${appointmentId}`);
  },
};
