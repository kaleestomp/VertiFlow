import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCSVtoJSON } from '../src/utils/dataframeUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __dataDir = path.join(__dirname, '../public/data_dev');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API endpoint to get data directory structure
app.get('/api/data-structure', (req, res) => {
  try {
    const dataDir = path.join(__dataDir, req.query.path);
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: 'Data directory not found' });
    }
    const dirTree = {
      url: dataDir,
      zones: {},
    };
    // Scan zones
    const zones = fs.readdirSync(dataDir).filter(f => 
      fs.statSync(path.join(dataDir, f)).isDirectory()
    );
    zones.forEach(zone => {
      const zonePath = path.join(dataDir, zone);
      dirTree.zones[zone] = {
        configs: {}
      };
      // Scan Configs inside each zone
      const configs = fs.readdirSync(zonePath).filter(f => 
        fs.statSync(path.join(zonePath, f)).isDirectory()
      );
      configs.forEach(config => {
        const configPath = path.join(zonePath, config);
        dirTree.zones[zone].configs[config] = {};
        // Scan Runs inside each config
        const runs = fs.readdirSync(configPath).filter(f => 
          fs.statSync(path.join(configPath, f)).isDirectory()
        );
        runs.forEach(run => {
          const runPath = path.join(configPath, run);
          // Scan files inside each run
          const files = fs.readdirSync(runPath).filter(f => {
            const stat = fs.statSync(path.join(runPath, f));
            return stat.isFile() && (f.endsWith('.csv'));
          });
          // Categorize files by type
          dirTree.zones[zone].configs[config][run] = {
            //files: files,
            liftLogbooks: files.filter(f => f.includes('lift_logbook') && f.endsWith('.csv')),
            timelineLogbooks: files.filter(f => f.includes('timeline_logbook') && f.endsWith('.csv')),
            passengerLogbooks: files.filter(f => f.includes('passenger_logbook') && f.endsWith('.csv'))
          };
        });
      });
    });

    res.json(dirTree);
  } catch (error) {
    console.error('Error scanning data structure:', error);
    res.status(500).json({ error: 'Failed to scan data directory' });
  }
});

app.post('/api/data-pack', async (req, res) => {
  try {
    const { simTree: rawSimTree, url } = req.body ?? {};

    let simTree = rawSimTree;
    if (typeof simTree === 'string') {
      try {
        simTree = JSON.parse(simTree);
      } catch {
        return res.status(400).json({ error: 'Invalid simTree JSON string' });
      }
    }

    if (!simTree || typeof simTree !== 'object' || Array.isArray(simTree) || typeof url !== 'string') {
      return res.status(400).json({ error: 'Invalid payload. Expected { url, simTree }' });
    }
    
    const urlBase = url.replace(/\/+$/g, '');
    const simData = {
      liftLogbooks: {},
      timelineLogbooks: {},
      passengerLogbooks: {}
    };
    
    // Process each run
    for (const [runID, runDirTree] of Object.entries(simTree)) {
      for (const [fileCategory, fileNames] of Object.entries(runDirTree)) {
        const fileList = Array.isArray(fileNames) ? fileNames : [];
        if (fileCategory !== 'timelineLogbooks') {
          if (fileList.length > 0) {
            const csvPath = `${urlBase}/${runID}/${fileList[0]}`;
            simData[fileCategory][runID] = await loadCSVtoJSON(csvPath);
          }
          continue;
        }

        simData[fileCategory][runID] = {};
        for (const file of fileList) {
          try {
            const csvPath = `${urlBase}/${runID}/${file}`;
            let lvlID = 'all';
            if (file.split('_').length === 3) {
              lvlID = file.split('_')[2];
            }
            simData[fileCategory][runID][lvlID] = await loadCSVtoJSON(csvPath);
          } catch (error) {
            // File might not exist, skip it
            console.log(`File not found or error loading: ${file} -> ${runID}`, error);
          }
        }
      }
    };
    res.json(simData);
  } catch (error) {
    console.error('Error fetching sim data:', error);
    res.status(500).json({ error: 'Failed to fetch sim data' });
  }
});

// Serve static data files (CSV, feather, parquet)
app.use('/data_dev', express.static(path.join(__dirname, '../public/data_dev')));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/data-structure`);
  console.log(`API available at http://localhost:${PORT}/api/data-pack`);
});
