import { API_URL } from "../config/api";

export type AuthMode = "guest" | "user";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin" | "guest";
  isStudent?: boolean;
  universityEmail?: string;
  profilePictureUrl?: string;
  createdAt?: string;
};

export function getToken() {
  return localStorage.getItem("token");
}

export function getAuthMode(): AuthMode | null {
  const mode = localStorage.getItem("auth_mode");
  if (mode === "guest" || mode === "user") {
    return mode;
  }
  return null;
}

export function setAuthMode(mode: AuthMode) {
  localStorage.setItem("auth_mode", mode);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("auth_mode");
}

export function getAuthHeaders(baseHeaders: HeadersInit = {}) {
  const token = getToken();

  if (!token) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const headers = getAuthHeaders(options.headers || {});

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearToken();
  }

  return response;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = getToken();
  const mode = getAuthMode();

  if (!token || mode !== "user") {
    return null;
  }

  try {
    const res = await fetchWithAuth("/auth/me");
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as AuthUser;
    return data;
  } catch (err) {
    console.error("Failed to fetch current user:", err);
    return null;
  }
}
