import { ApiError } from './apiClient';
import { env } from './env';
import { getAccessToken } from './authTokens';

type UploadResponse = {
  message: string;
  imageUrl: string;
  publicId: string;
  imageUrls?: string[];
  publicIds?: string[];
};

export async function uploadImages(files: File[]) {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError('You must be signed in to upload images', 401, null);
  }
  if (files.length === 0) {
    throw new ApiError('Select at least one image', 400, null);
  }
  if (files.length > 5) {
    throw new ApiError('You can upload at most 5 images', 400, null);
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));

  const res = await fetch(`${env.apiBaseUrl}/api/uploads/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Upload failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data as UploadResponse;
}
