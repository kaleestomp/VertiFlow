import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API endpoint to get data directory structure
app.get('/api/data-structure', (req, res) => {
  try {
    const dataDir = path.join(__dirname, '../public/data_dev/Direct-3Zone-DD-Lunch');
    
    if (!fs.existsSync(dataDir)) {
      return res.status(404).json({ error: 'Data directory not found' });
    }

    const structure = {
      zones: {}
    };

    // Scan zones
    const zones = fs.readdirSync(dataDir).filter(f => 
      fs.statSync(path.join(dataDir, f)).isDirectory()
    );

    zones.forEach(zone => {
      structure.zones[zone] = {
        configs: {}
      };

      const zonePath = path.join(dataDir, zone);
      const configs = fs.readdirSync(zonePath).filter(f => 
        fs.statSync(path.join(zonePath, f)).isDirectory()
      );

      configs.forEach(config => {
        const configPath = path.join(zonePath, config);
        const runs = fs.readdirSync(configPath).filter(f => 
          fs.statSync(path.join(configPath, f)).isDirectory()
        );

        structure.zones[zone].configs[config] = {};

        // Scan files inside each run
        runs.forEach(run => {
          const runPath = path.join(configPath, run);
          const files = fs.readdirSync(runPath).filter(f => {
            const stat = fs.statSync(path.join(runPath, f));
            return stat.isFile() && (f.endsWith('.csv'));
          });

          structure.zones[zone].configs[config][run] = {
            files: files,
            // Categorize files by type
            liftLogbooks: files.filter(f => f.includes('lift_logbook') && f.endsWith('.csv')),
            timelineLogbooks: files.filter(f => f.includes('timeline_logbook') && f.endsWith('.csv')),
            passengerLogbooks: files.filter(f => f.includes('passenger_logbook') && f.endsWith('.csv'))
          };
        });
      });
    });

    res.json(structure);
  } catch (error) {
    console.error('Error scanning data structure:', error);
    res.status(500).json({ error: 'Failed to scan data directory' });
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
});
