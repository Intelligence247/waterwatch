import { api } from './apiClient';

export type ReportStatus = 'pending' | 'verified' | 'dismissed' | 'resolved';

type BackendFaultReport = {
  id: string;
  waterpointId: string | null;
  waterpoint?: { id: string; name: string } | null;
  reporterName: string;
  reporterPhone: string;
  description: string;
  photoUrl: string;
  latitude: number | null;
  longitude: number | null;
  community: string;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: BackendFaultReport[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FaultReportItem = {
  id: string;
  waterpoint_id: string | null;
  waterpoints?: { name: string } | null;
  reporter_name: string;
  reporter_phone: string;
  description: string;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  community: string;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
};

function mapReport(item: BackendFaultReport): FaultReportItem {
  return {
    id: item.id,
    waterpoint_id: item.waterpointId,
    waterpoints: item.waterpoint ? { name: item.waterpoint.name } : null,
    reporter_name: item.reporterName,
    reporter_phone: item.reporterPhone ?? '',
    description: item.description,
    photo_url: item.photoUrl ?? '',
    latitude: item.latitude,
    longitude: item.longitude,
    community: item.community,
    status: item.status,
    reviewed_by: item.reviewedBy,
    reviewed_at: item.reviewedAt,
    resolution_note: item.resolutionNote ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export async function listFaultReports(params?: {
  status?: ReportStatus;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const path = query.toString() ? `/api/fault-reports?${query.toString()}` : '/api/fault-reports';
  const response = await api.get<ListResponse>(path, { auth: true });
  return {
    ...response,
    items: response.items.map(mapReport),
  };
}

export async function createFaultReport(payload: {
  waterpointId?: string;
  reporterName: string;
  reporterPhone?: string;
  description: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  community: string;
}) {
  const response = await api.post<{ report: BackendFaultReport }>(
    '/api/fault-reports',
    payload,
    { auth: true },
  );
  return mapReport(response.report);
}

export async function updateFaultReportStatus(id: string, payload: { status: ReportStatus; resolutionNote?: string }) {
  const response = await api.patch<{ report: BackendFaultReport }>(
    `/api/fault-reports/${id}/status`,
    payload,
    { auth: true },
  );
  return mapReport(response.report);
}
