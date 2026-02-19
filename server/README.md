# Python Backend Server

This Python server (FastAPI) provides API endpoints for the Vertiflow React application and serves static data files.

## Features

- **API Endpoint**: `/api/data-structure` - Returns the directory structure of your data files
- **API Endpoint**: `/api/data-pack` - Loads dataframe files for selected runs
- **API Endpoint**: `/api/save-dataframe` - Saves dataframe payloads to `public/data_dev`
- **Static Files**: Serves CSV, feather, parquet, and other files from `/data_dev`

## Development

Run the backend server alongside Vite during development:

```bash
# Terminal 1 - Run Vite dev server (React frontend)
npm run dev

# Terminal 2 - Create/activate Python env (optional)
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r server/requirements.txt

# Run Python backend API (port 3000 by default)
python server/python_server.py
```

The API will be available at `http://localhost:3000`

## Environment Variables

You can configure the API URL in your React app:

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000` in development)
- `PORT` - Python backend port (default: `3000`)

## API Endpoints

### GET /api/data-structure

Returns the hierarchical structure of your data directory.

**Response Example:**
```json
{
  "zones": {
    "Zone1": {
      "configs": {
        "config1": ["run1", "run2"],
        "config2": ["run1"]
      }
    }
  }
}
```

### POST /api/data-pack

Loads dataframes based on a selected simulation tree.

**Request Example:**
```json
{
  "url": "C:/.../public/data_dev/Project1/Direct-3Zone-DD-Lunch/South Tower - Office - High Zone/605",
  "simTree": {
    "1": {
      "liftLogbooks": ["lift_logbook.csv"],
      "timelineLogbooks": ["timeline_logbook_1.csv"],
      "passengerLogbooks": ["passenger_logbook.csv"]
    }
  }
}
```

### POST /api/save-dataframe

Saves records to a file under `public/data_dev`.

**Request Example:**
```json
{
  "path": "Project1/output/new_data.csv",
  "format": "csv",
  "records": [
    { "a": 1, "b": 2 },
    { "a": 3, "b": 4 }
  ]
}
```

### GET /data_dev/*

Serves static files from the `public/data_dev` directory.
