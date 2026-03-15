// Get API base URL (use environment variable or default to localhost)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchDirTree( relativePath, { signal } = {} ) {
  const params = new URLSearchParams({ path: relativePath });
  const res = await fetch(`${API_BASE}/api/option-meta?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch option directory structure: ${res.status} ${res.statusText}`);
  }
  const dirTree = await res.json();
  return dirTree;
}