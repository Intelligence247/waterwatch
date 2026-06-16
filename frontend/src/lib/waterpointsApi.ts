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
  duplicateReview?: {
    status: 'clear' | 'pending_review' | 'resolved_keep' | 'resolved_merged';
    candidateWaterpointId: string | null;
    candidateWaterpointName?: string | null;
    distanceMeters: number | null;
    flaggedAt: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    resolutionNote?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type DuplicateReviewWarning = {
  message: string;
  policy: {
    minDistanceMeters: number;
    reviewDistanceMeters: number;
    typeScope: WaterpointType;
    communityScope: string;
  };
  conflict: {
    id: string;
    name: string;
    community: string;
    type: WaterpointType;
    latitude: number;
    longitude: number;
    distanceMeters: number;
  };
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

export type WaterpointWriteResult = {
  message: string;
  waterpoint: Waterpoint;
  duplicateReviewWarning?: DuplicateReviewWarning;
};

export type DuplicateReviewQueueItem = Waterpoint;

type DuplicateReviewQueueResponse = {
  items: BackendWaterpoint[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ResolveDuplicateReviewPayload = {
  action: 'keep' | 'merge';
  mergeIntoWaterpointId?: string;
  resolutionNote?: string;
  leftUpdates?: Partial<WaterpointWritePayload>;
  rightUpdates?: Partial<WaterpointWritePayload>;
};

export type DuplicateAuditCandidate = {
  left: {
    id: string;
    name: string;
    type: WaterpointType;
    status: WaterpointStatus;
    community: string;
    lga: string;
    description: string;
    latitude: number;
    longitude: number;
    reviewStatus: string;
  };
  right: {
    id: string;
    name: string;
    type: WaterpointType;
    status: WaterpointStatus;
    community: string;
    lga: string;
    description: string;
    latitude: number;
    longitude: number;
    reviewStatus: string;
  };
  distanceMeters: number;
  nameSimilarityScore: number;
  recommendation: 'hard_duplicate' | 'merge_candidate' | 'review_candidate';
};

export type DuplicateAuditResponse = {
  policy: {
    minDistanceMeters: number;
    reviewDistanceMeters: number;
    auditDistanceMeters: number;
    includeResolved: boolean;
  };
  scanned: {
    considered: number;
    maxItems: number;
    truncated: boolean;
  };
  summary: {
    exactDuplicateGroups: number;
    exactDuplicateRecords: number;
    proximityCandidates: number;
    hardDuplicates: number;
    mergeCandidates: number;
    reviewCandidates: number;
  };
  exactDuplicateGroups: Array<{
    duplicateKey: string;
    count: number;
    waterpointIds: string[];
  }>;
  proximityCandidates: DuplicateAuditCandidate[];
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
    duplicate_review: item.duplicateReview
      ? {
          status: item.duplicateReview.status,
          candidate_waterpoint_id: item.duplicateReview.candidateWaterpointId ?? null,
          candidate_waterpoint_name: item.duplicateReview.candidateWaterpointName ?? null,
          distance_meters: item.duplicateReview.distanceMeters ?? null,
          flagged_at: item.duplicateReview.flaggedAt ?? null,
          reviewed_at: item.duplicateReview.reviewedAt ?? null,
          reviewed_by: item.duplicateReview.reviewedBy ?? null,
          resolution_note: item.duplicateReview.resolutionNote ?? '',
        }
      : undefined,
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
  auth?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const path = query.toString() ? `/api/waterpoints?${query.toString()}` : '/api/waterpoints';
  const response = await api.get<ListResponse>(path, { auth: params?.auth ?? false });
  return {
    ...response,
    items: response.items.map(mapBackendWaterpoint),
  };
}

export async function createWaterpoint(payload: WaterpointWritePayload) {
  const response = await api.post<{
    message: string;
    waterpoint: BackendWaterpoint;
    duplicateReviewWarning?: DuplicateReviewWarning;
  }>(
    '/api/waterpoints',
    payload,
    { auth: true },
  );
  return {
    message: response.message,
    waterpoint: mapBackendWaterpoint(response.waterpoint),
    duplicateReviewWarning: response.duplicateReviewWarning,
  } satisfies WaterpointWriteResult;
}

export async function updateWaterpoint(id: string, payload: Partial<WaterpointWritePayload>) {
  const response = await api.patch<{
    message: string;
    waterpoint: BackendWaterpoint;
    duplicateReviewWarning?: DuplicateReviewWarning;
  }>(
    `/api/waterpoints/${id}`,
    payload,
    { auth: true },
  );
  return {
    message: response.message,
    waterpoint: mapBackendWaterpoint(response.waterpoint),
    duplicateReviewWarning: response.duplicateReviewWarning,
  } satisfies WaterpointWriteResult;
}

export async function deleteWaterpoint(id: string) {
  await api.delete(`/api/waterpoints/${id}`, { auth: true });
}

export async function listDuplicateReviewQueue(params?: {
  status?: 'pending_review' | 'resolved_keep' | 'resolved_merged' | 'clear' | 'all';
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const path = query.toString()
    ? `/api/waterpoints/review-queue?${query.toString()}`
    : '/api/waterpoints/review-queue';
  const response = await api.get<DuplicateReviewQueueResponse>(path, { auth: true });
  return {
    ...response,
    items: response.items.map(mapBackendWaterpoint),
  };
}

export async function resolveDuplicateReview(id: string, payload: ResolveDuplicateReviewPayload) {
  const response = await api.patch<{ message: string; waterpoint: BackendWaterpoint }>(
    `/api/waterpoints/${id}/review`,
    payload,
    { auth: true },
  );
  return {
    message: response.message,
    waterpoint: mapBackendWaterpoint(response.waterpoint),
  };
}

export async function getWaterpointDedupeAudit(params?: {
  distanceMeters?: number;
  maxItems?: number;
  type?: WaterpointType;
  community?: string;
  includeResolved?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.distanceMeters) query.set('distanceMeters', String(params.distanceMeters));
  if (params?.maxItems) query.set('maxItems', String(params.maxItems));
  if (params?.type) query.set('type', params.type);
  if (params?.community) query.set('community', params.community);
  if (typeof params?.includeResolved === 'boolean') {
    query.set('includeResolved', String(params.includeResolved));
  }
  const path = query.toString()
    ? `/api/waterpoints/dedupe-audit?${query.toString()}`
    : '/api/waterpoints/dedupe-audit';
  return api.get<DuplicateAuditResponse>(path, { auth: true });
}
