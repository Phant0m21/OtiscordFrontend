const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const TOKEN_KEY = 'otiscord.access-token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { token = getToken(), ...options } = {}) {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Не удалось подключиться к серверу. Проверь, что API запущен и VITE_API_URL указан верно.');
  }
  if (!response.ok) {
    let detail = 'Не удалось выполнить запрос.';
    try {
      const error = await response.json();
      detail = error.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }
    if (response.status === 401) clearToken();
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

export function websocketUrl() {
  return API_URL.replace(/^http/, 'ws') + '/ws';
}
