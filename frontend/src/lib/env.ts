const DEFAULT_API_BASE_URL = "http://localhost:8050";

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
};

export function validateFrontendEnv() {
  if (!env.apiBaseUrl) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
}
