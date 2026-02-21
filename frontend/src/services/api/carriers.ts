import { api } from './client';
import type { Carrier, CarrierProduct } from '@/types';

export const carrierService = {
  async list(): Promise<{ items: Carrier[] }> {
    return api.get<{ items: Carrier[] }>('/marketplace/carriers');
  },

  async get(id: number): Promise<{ item: Carrier; products: CarrierProduct[] }> {
    return api.get<{ item: Carrier; products: CarrierProduct[] }>(`/marketplace/carriers/${id}`);
  },

  async getProducts(carrierId: number): Promise<{ items: CarrierProduct[] }> {
    return api.get<{ items: CarrierProduct[] }>(`/carrier/products?carrier_id=${carrierId}`);
  },

  async updateProduct(id: number, data: Partial<CarrierProduct>): Promise<{ message: string; item: CarrierProduct }> {
    return api.put<{ message: string; item: CarrierProduct }>(`/carrier/products/${id}`, data);
  },
};
