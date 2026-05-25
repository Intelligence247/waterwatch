import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./authTokens";
import { env } from "./env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
  _retry?: boolean;
};

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function parseResponseBody(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = false, signal } = options;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${env.apiBaseUrl}${normalizedPath}`, {
    method,
    headers: requestHeaders,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  let data = await parseResponseBody(res);

  if (!res.ok) {
    if (res.status === 401 && auth && !options._retry) {
      options._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${env.apiBaseUrl}/api/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json() as { accessToken: string; refreshToken?: string };
            setAuthTokens({
              accessToken: refreshData.accessToken,
              ...(refreshData.refreshToken ? { refreshToken: refreshData.refreshToken } : {}),
            });

            // Re-apply the new access token
            requestHeaders.Authorization = `Bearer ${refreshData.accessToken}`;

            res = await fetch(`${env.apiBaseUrl}${normalizedPath}`, {
              method,
              headers: requestHeaders,
              credentials: "include",
              body: body !== undefined ? JSON.stringify(body) : undefined,
              signal,
            });
            data = await parseResponseBody(res);
          }
        } catch (refreshErr) {
          console.error("Silent token refresh failed:", refreshErr);
        }
      }
    }

    if (res.status === 401) {
      clearAuthTokens();
      unauthorizedHandler?.();
    }

    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed with status ${res.status}`;

    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
