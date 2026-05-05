import { api } from './apiClient';

type BackendComment = {
  id: string;
  waterpointId: string | null;
  waterpoint?: { id: string; name: string } | null;
  authorId: string;
  author?: { fullName: string; community?: string } | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: BackendComment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CommunityComment = {
  id: string;
  waterpoint_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  citizen_profiles?: { full_name: string; community: string } | null;
  waterpoints?: { name: string } | null;
};

function mapComment(item: BackendComment): CommunityComment {
  return {
    id: item.id,
    waterpoint_id: item.waterpointId,
    author_id: item.authorId,
    content: item.content,
    created_at: item.createdAt,
    citizen_profiles: item.author
      ? { full_name: item.author.fullName, community: item.author.community ?? '' }
      : null,
    waterpoints: item.waterpoint ? { name: item.waterpoint.name } : null,
  };
}

export async function listComments(params?: { page?: number; limit?: number; waterpointId?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.waterpointId) query.set('waterpointId', params.waterpointId);
  const path = query.toString() ? `/api/comments?${query.toString()}` : '/api/comments';
  const response = await api.get<ListResponse>(path, { auth: true });
  return {
    ...response,
    items: response.items.map(mapComment),
  };
}

export async function createComment(payload: { waterpointId?: string; content: string }) {
  const response = await api.post<{ comment: BackendComment }>(
    '/api/comments',
    payload,
    { auth: true },
  );
  return mapComment(response.comment);
}

export async function deleteComment(id: string) {
  await api.delete(`/api/comments/${id}`, { auth: true });
}
