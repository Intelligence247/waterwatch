import { api } from './apiClient';
import type { Waterpoint, WaterpointStatus, WaterpointType } from './types';

type BackendRecentWaterpoint = {
  id: string;
  name: string;
  type: WaterpointType;
  status: WaterpointStatus;
  community: string;
  lga?: string;
  updatedAt: string;
};

type AdminOverviewResponse = {
  stats: {
    totalWaterpoints: number;
    functional: number;
    faulty: number;
    underRepair: number;
    totalReports: number;
    pendingReports: number;
    verifiedReports: number;
    resolvedReports: number;
    dismissedReports: number;
  };
  recentWaterpoints: BackendRecentWaterpoint[];
};

type CitizenOverviewResponse = {
  userId: string;
  stats: {
    totalWaterpoints: number;
    functional: number;
    faulty: number;
    underRepair: number;
    myReports: number;
    pendingReports: number;
    resolvedReports: number;
    dismissedReports: number;
  };
  nearbyWaterpoints: Array<{
    id: string;
    name: string;
    type: WaterpointType;
    status: WaterpointStatus;
    community: string;
  }>;
};

export type DuplicateReviewInsightsResponse = {
  windowDays: number;
  stats: {
    pendingReview: number;
    resolvedKeep: number;
    resolvedMerged: number;
    clear: number;
    totalReviewedInWindow: number;
    reviewedKeepInWindow: number;
    reviewedMergedInWindow: number;
    avgReviewedKeepDistanceMeters: number;
    avgReviewedMergedDistanceMeters: number;
    pendingOldestAgeDays: number;
    pendingCount: number;
  };
};

function mapRecentWaterpoint(item: BackendRecentWaterpoint): Waterpoint {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    latitude: 0,
    longitude: 0,
    community: item.community,
    lga: item.lga ?? '',
    description: '',
    photo_url: '',
    photo_urls: [],
    created_at: item.updatedAt,
    updated_at: item.updatedAt,
  };
}

export async function getAdminOverview() {
  const response = await api.get<AdminOverviewResponse>('/api/analytics/admin-overview', { auth: true });
  return {
    stats: response.stats,
    recentWaterpoints: response.recentWaterpoints.map(mapRecentWaterpoint),
  };
}

export async function getCitizenOverview() {
  return api.get<CitizenOverviewResponse>('/api/analytics/citizen-overview', { auth: true });
}

export async function getDuplicateReviewInsights(days = 30) {
  const query = new URLSearchParams({ days: String(days) });
  return api.get<DuplicateReviewInsightsResponse>(
    `/api/analytics/duplicate-review-insights?${query.toString()}`,
    { auth: true },
  );
}
