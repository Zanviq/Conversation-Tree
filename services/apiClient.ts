// Thin wrapper around the backend API. The session lives in an httpOnly cookie, so no token handling here.

export interface User {
  id: string;
  username: string;
  displayName: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const apiFetch = async <T = unknown>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || `Request failed (${response.status})`);
  }
  return data as T;
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const { user } = await apiFetch<{ user: User }>('/auth/me');
    return user;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
};

export const login = async (username: string, password: string): Promise<User> => {
  const { user } = await apiFetch<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return user;
};

export const register = async (username: string, password: string, displayName: string): Promise<User> => {
  const { user } = await apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  });
  return user;
};

export const logout = () => apiFetch<void>('/auth/logout', { method: 'POST' });
