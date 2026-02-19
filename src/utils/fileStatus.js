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

export async function fetchLocalFile(relativePath) {
  const params = new URLSearchParams({ path: relativePath });
  const response = await fetch(`${API_BASE}/api/file?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }

  return response.text(); // use response.json() if the file is JSON
}

// /**
//  * Read all data for a specific zone
//  * @param {Object} simDirTree - Object with run names as keys and file names as values
//  */
// export async function fetchSimDataPack(simDirTree) {
//   const urlBase = simDirTree.url; // Base URL for fetching files
//   const simData = {
//     liftLogbooks: {},
//     timelineLogbooks: {},
//     passengerLogbooks: {}
//   };
//   // Process each run
//   for (const [runID, runDirTree] of Object.entries(simDirTree.simTree)) {
//     for (const [fileCategory, fileName] of Object.entries(runDirTree)) {
//       try {
//         const url = `${urlBase}/${runID}/${fileName}`;
//         simData[fileCategory][runID] = await loadCSV(url);
//       } catch (error) {
//         // File might not exist, skip it
//         console.log(`File not found or error loading: ${fileName} -> ${runID}`, error);
//       }
//     }
//   };
//   return simData;
// }