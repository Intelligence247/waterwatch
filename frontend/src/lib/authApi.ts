import { api } from "./apiClient";

export async function resendVerification(email: string) {
  const response = await api.post<{ message: string }>("/api/auth/resend-verification", { email });
  return response;
}

export async function forgotPassword(email: string) {
  const response = await api.post<{ message: string }>("/api/auth/forgot-password", { email });
  return response;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await api.post<{ message: string }>("/api/auth/reset-password", { token, newPassword });
  return response;
}

export async function verifyEmail(token: string) {
  const response = await api.get<{ message: string }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  return response;
}

