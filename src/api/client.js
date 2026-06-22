const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export function getToken() {
  return localStorage.getItem('library_token');
}

export function setSession({ token, user }) {
  if (token) localStorage.setItem('library_token', token);
  if (user) localStorage.setItem('library_user', JSON.stringify(user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('library_user') || 'null');
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('library_token');
  localStorage.removeItem('library_user');
}

function normalizeErrors(errorPayload) {
  if (!errorPayload?.errors) return errorPayload?.message || 'حدث خطأ غير متوقع';
  return Object.values(errorPayload.errors).flat().join(' | ');
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(normalizeErrors(payload));
  }

  return payload;
}

export function getList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function getSingle(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  return payload || null;
}