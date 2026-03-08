// Electron always talks to local backend
const API_BASE = 'http://127.0.0.1:8000/api';

// snake_case <-> camelCase conversion
function toSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function convertKeys(obj, fn) {
  if (Array.isArray(obj)) return obj.map((item) => convertKeys(item, fn));
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [fn(k), convertKeys(v, fn)])
    );
  }
  return obj;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = { ...options };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(convertKeys(config.body, toSnake));
    config.headers = { 'Content-Type': 'application/json', ...config.headers };
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await res.json();
    return convertKeys(json, toCamel);
  }
  return res;
}

// --- Projects ---
export const projects = {
  list: () => request('/projects'),
  get: (id) => request(`/projects/${id}`),
  create: (data) => request('/projects', { method: 'POST', body: data }),
  update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
};

// --- Annotations ---
export const annotations = {
  list: (projectId) => request(`/projects/${projectId}/annotations`),
  create: (projectId, data) =>
    request(`/projects/${projectId}/annotations`, { method: 'POST', body: data }),
  update: (projectId, annId, data) =>
    request(`/projects/${projectId}/annotations/${annId}`, { method: 'PUT', body: data }),
  delete: (projectId, annId) =>
    request(`/projects/${projectId}/annotations/${annId}`, { method: 'DELETE' }),
  exportUrl: (projectId, format = 'json') =>
    `${API_BASE}/projects/${projectId}/annotations/export?format=${format}`,
};

// --- Rallies ---
export const rallies = {
  list: (projectId) => request(`/projects/${projectId}/rallies`),
  createOrUpdate: (projectId, data) =>
    request(`/projects/${projectId}/rallies`, { method: 'POST', body: data }),
  update: (projectId, rallyNumber, data) =>
    request(`/projects/${projectId}/rallies/${rallyNumber}`, { method: 'PUT', body: data }),
};

// --- Health ---
export const health = () => request('/health');
