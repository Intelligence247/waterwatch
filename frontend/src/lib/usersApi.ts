import { api } from './apiClient';
import type { User, UserStatus } from './types';

export type UserListParams = {
  page?: number;
  limit?: number;
  q?: string;
  role?: 'admin' | 'citizen';
  status?: UserStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'fullName' | 'email';
  sortOrder?: 'asc' | 'desc';
};

export type UserListResponse = {
  items: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function listUsers(params?: UserListParams) {
  const query = new URLSearchParams();
  if (params) {
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.q) query.set('q', params.q);
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  }

  const queryString = query.toString();
  const path = queryString ? `/api/users?${queryString}` : '/api/users';
  return api.get<UserListResponse>(path, { auth: true });
}

export async function updateUserStatus(
  id: string,
  payload: { status: UserStatus; reason?: string | null },
) {
  return api.put<{ message: string; user: User }>(`/api/users/${id}/status`, payload, { auth: true });
}
