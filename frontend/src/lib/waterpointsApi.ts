import { api } from './apiClient';
import type { Waterpoint, WaterpointStatus, WaterpointType } from './types';

type BackendWaterpoint = {
  id: string;
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  latitude: number;
  longitude: number;
  community: string;
  lga: string;
  description: string;
  photoUrl?: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: BackendWaterpoint[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type WaterpointWritePayload = {
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  latitude: number;
  longitude: number;
  community: string;
  lga: string;
  description?: string;
  photoUrls?: string[];
};

function mapBackendWaterpoint(item: BackendWaterpoint): Waterpoint {
  const urls = item.photoUrls ?? (item.photoUrl ? [item.photoUrl] : []);
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    latitude: item.latitude,
    longitude: item.longitude,
    community: item.community,
    lga: item.lga,
    description: item.description ?? '',
    photo_url: urls[0] ?? '',
    photo_urls: urls,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export async function listWaterpoints(params?: {
  status?: WaterpointStatus;
  type?: WaterpointType;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const path = query.toString() ? `/api/waterpoints?${query.toString()}` : '/api/waterpoints';
  const response = await api.get<ListResponse>(path);
  return {
    ...response,
    items: response.items.map(mapBackendWaterpoint),
  };
}

export async function createWaterpoint(payload: WaterpointWritePayload) {
  const response = await api.post<{ waterpoint: BackendWaterpoint }>(
    '/api/waterpoints',
    payload,
    { auth: true },
  );
  return mapBackendWaterpoint(response.waterpoint);
}

export async function updateWaterpoint(id: string, payload: Partial<WaterpointWritePayload>) {
  const response = await api.patch<{ waterpoint: BackendWaterpoint }>(
    `/api/waterpoints/${id}`,
    payload,
    { auth: true },
  );
  return mapBackendWaterpoint(response.waterpoint);
}

export async function deleteWaterpoint(id: string) {
  await api.delete(`/api/waterpoints/${id}`, { auth: true });
}
