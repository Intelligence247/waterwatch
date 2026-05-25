import { api } from "./apiClient";

export interface SystemSettings {
  waterpointMinDistanceMeters: number;
  waterpointReviewDistanceMeters: number;
  waterpointAuditDistanceMeters: number;
}

export const settingsApi = {
  getSettings: () => api.get<{ settings: SystemSettings }>("/api/settings", { auth: true }),
  updateSettings: (settings: Partial<SystemSettings>) =>
    api.patch<{ message: string; settings: SystemSettings }>("/api/settings", settings, { auth: true }),
};
