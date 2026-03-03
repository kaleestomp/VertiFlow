// Get API base URL (use environment variable or default to localhost)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchDirTree(relativePath) {
  const params = new URLSearchParams({ path: relativePath });
  const res = await fetch(`${API_BASE}/api/dir-tree?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch option directory structure: ${res.status} ${res.statusText}`);
  }
  const dirTree = await res.json();
  return dirTree;
}

//Simple in-memory cache for sim data packs
//May bloat memory
const simCache = new Map();
export async function fetchSimDataPack(relativePath) {
  // Check cache first
  if (simCache.has(relativePath)) return simCache.get(relativePath);
  const params = new URLSearchParams({ path: relativePath });
  const res = await fetch(`${API_BASE}/api/read-sim?${params}`);

  if (!res.ok) throw new Error(`Failed to fetch sim data pack: ${res.status} ${res.statusText}`);
  const data = await res.json();

  simCache.set(relativePath, data);
  return data;
}

