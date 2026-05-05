import { api } from "./apiClient";

export async function resendVerification(email: string) {
  const response = await api.post<{ message: string }>("/api/auth/resend-verification", { email });
  return response;
}

