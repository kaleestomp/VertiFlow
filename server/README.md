# Express Backend Server

This Express server provides API endpoints for the Vertiflow React application and serves static data files.

## Features

- **API Endpoint**: `/api/data-structure` - Returns the directory structure of your data files
- **Static Files**: Serves CSV, feather, and parquet files from `/data_dev`
- **Production Ready**: Serves the built React app in production mode

## Development

Run the backend server alongside Vite during development:

```bash
# Terminal 1 - Run Vite dev server (React frontend)
npm run dev

# Terminal 2 - Run Express server (Backend API)
npm run server:dev
```

The API will be available at `http://localhost:3000`

## Production

Build and run for production:

```bash
# Build React app
npm run build

# Start production server (serves both API and built React app)
npm start
```

## Environment Variables

You can configure the API URL in your React app:

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3000` in development)

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

### GET /data_dev/*

Serves static files from the `public/data_dev` directory.
