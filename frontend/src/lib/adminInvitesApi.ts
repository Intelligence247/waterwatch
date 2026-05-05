import { api } from './apiClient';

export type AdminInviteStatusFilter = 'active' | 'used' | 'revoked' | 'expired' | 'all';

export type AdminInviteListItem = {
  id: string;
  email: string;
  invitedBy: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type ListResponse = {
  items: AdminInviteListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function createAdminInvite(payload: { email: string; expiresInHours?: number }) {
  return api.post<{
    message: string;
    invite: AdminInviteListItem & { inviteToken: string };
    emailSent?: boolean;
  }>('/api/auth/admin-invites', payload, { auth: true });
}

export async function listAdminInvites(params?: {
  status?: AdminInviteStatusFilter;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const path = query.toString() ? `/api/auth/admin-invites?${query.toString()}` : '/api/auth/admin-invites';
  return api.get<ListResponse>(path, { auth: true });
}

export async function revokeAdminInvite(id: string) {
  return api.delete<{ message: string }>(`/api/auth/admin-invites/${id}`, { auth: true });
}
