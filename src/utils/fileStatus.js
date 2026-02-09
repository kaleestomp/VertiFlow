import { loadCSV } from '../utils/dataframeUtils';

// Get API base URL (use environment variable or default to localhost)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Fetch the data directory structure from the backend API
 */
export async function getDataStructure() {
  try {
    const response = await fetch(`${API_BASE}/api/data-structure`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data structure: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data structure:', error);
    throw error;
  }
}

/**
 * Read all data for a specific zone
 * @param {string} zone - Zone name (e.g., 'Zone1')
 * @param {Object} configs - Object with config names as keys and run arrays as values
 */
export async function readZone(zone, configs) {
  const dataRead = {
    configs: {}
  };

  // Process each config
  for (const [configID, runs] of Object.entries(configs)) {
    const configRead = {
      liftLogbooks: {},
      timelineLogbooks: {},
      passengerLogbooks: {}
    };

    // Process each run
    for (const runID of runs) {
      // Try to fetch each file type
      const fileTypes = [
        { name: 'lift_logbook', key: 'liftLogbooks' },
        { name: 'timeline_logbook', key: 'timelineLogbooks' },
        { name: 'passenger_logbook', key: 'passengerLogbooks' }
      ];

      for (const fileType of fileTypes) {
        try {
          // Construct URL: /data_dev/Direct-3Zone-DD-Lunch/zone/config/run/file.csv
          const url = `${API_BASE}/data_dev/Direct-3Zone-DD-Lunch/${zone}/${configID}/${runID}/${fileType.name}.csv`;
          const fileData = await loadCSV(url);
          configRead[fileType.key][runID] = fileData;
        } catch (error) {
          // File might not exist, skip it
          console.log(`File not found or error loading: ${fileType.name} for ${configID}/${runID}`);
        }
      }
    }
    dataRead.configs[configID] = configRead;
  }
  
  return dataRead;
}