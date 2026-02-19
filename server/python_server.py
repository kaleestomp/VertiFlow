import os
import json
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse


SERVER_DIR = Path(__file__).resolve().parent
DATA_DIR = (SERVER_DIR / "../public/data_dev").resolve()

# Convert Relative Path to Absolute ---- 
def _safe_resolve(relative_path: str) -> Path:
    target = (DATA_DIR / relative_path).resolve()
    if target != DATA_DIR and DATA_DIR not in target.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    return target

app = FastAPI(title="Data Provider API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Report Filing Structure within an Option's Directory ---- 
@app.get("/api/dir-tree")
def get_option_dir_structure(path: str = Query(..., description="Path relative to public/data_dev")):
  try:
    OPTION_DIR = _safe_resolve(path)
    if not OPTION_DIR.exists() or not OPTION_DIR.is_dir():
        raise HTTPException(status_code=404, detail="Data directory not found")
    dirTree = {
      "url": str(path),
      "zones": {},
    }
    # Scan zones
    zones = [f for f in OPTION_DIR.iterdir() if f.is_dir()]
    for zone in zones:
        dirTree["zones"][zone.name] = [f.name for f in zone.iterdir() if f.is_dir()]

    return dirTree
  
  except HTTPException:
        raise
  except Exception as error:
    print('Error scanning data structure:', error)
    raise HTTPException(status_code=500, detail="Failed to scan data directory")

@app.get("/api/read-sim")
def read_sim(path: str = Query(..., description="Path relative to public/data_dev")):
    data_pack = {}
    sim_path = _safe_resolve(path)
    if not sim_path.exists() or not sim_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")
    # Scan Runs inside each SimFolder
    data_pack = {
        "TimelineLogbooks": {},
        "PassengerLogbooks": {},
    }
    runs = [f for f in sim_path.iterdir() if f.is_dir()]
    for run in runs:
        # Scan files inside each run
        files = [f for f in run.iterdir() if f.is_file() and f.name.endswith('.feather')]
        # Categorize files by type
        for f in files:
            if "timeline_logbook" in f.name:
                df = pd.read_feather(f, columns=['time', 'queue_length', 'mean_wait_time', 'mean_travel_time'])
                df_json = df.to_dict(orient="records") #json.loads(df.to_json(orient="records"))
                lvlID = "all" if len(f.name.split("_")) == 2 else f.name.split("_")[-1].split(".")[0]
                data_pack["TimelineLogbooks"].setdefault(lvlID, {})[run.name] = df_json
            elif "passenger_logbook" in f.name:
                df = pd.read_feather(f, columns=['wait_time', 'travel_time'])
                df_json = df.to_dict(orient="records")
                data_pack["PassengerLogbooks"][run.name] = df_json

    return data_pack

@app.get("/api/file")
def get_file(path: str = Query(..., description="Path relative to public/data_dev")):
    file_path = _safe_resolve(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("python_server:app", host="0.0.0.0", port=port, reload=False)