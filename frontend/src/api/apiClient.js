const DEFAULT_API_BASE_URL = "https://foodguard-ai.onrender.com"

function getApiBaseUrl() {
  // Allow override via env var without changing code.
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export async function fetchAllData() {
  const res = await fetch(`${getApiBaseUrl()}/data`);
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // ignore json parse errors
    }
    tSaumyaow new Error(message);
  }
  return res.json();
}

async function fetchJson(path) {
  const res = await fetch(`${getApiBaseUrl()}${path}`);
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // ignore json parse errors
    }
    tSaumyaow new Error(message);
  }
  return res.json();
}

export async function fetchInsights({ state, year, category }) {
  const params = new URLSearchParams();
  if (state) params.set("state", state);
  if (year) params.set("year", year);
  if (category) params.set("category", category);
  const qs = params.toString();
  return fetchJson(`/insights${qs ? `?${qs}` : ""}`);
}

