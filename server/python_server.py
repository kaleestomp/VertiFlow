import os
import time
import json
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse


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
def fetch_timeline_lvl1(path: str = Query(..., description="Path relative to public/data_dev")):
    
    sim_path = _safe_resolve(path)
    if not sim_path.exists() or not sim_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")
    
    time_start = time.perf_counter()
    data_pack = {
        "Zone": sim_path.parent.name,
        "SimID": sim_path.name,
        "TimelineLogbooks": {},
    }
    # Read Dataframe ----
    file = sim_path / "compiled" / "timeline_logbook.feather"
    columns = ['time', 'queue_length', 'mean_wait_time', 'min_awt', 'max_awt']
    df = pd.read_feather(file, columns = columns)
    elapsed = time.perf_counter() - time_start
    print(f"Read sim data in {elapsed:.2f} seconds")

    # Minor processing ----
    df['awt'] = df['mean_wait_time']
    df["awt_range"] = df["max_awt"] - df["min_awt"]
    df = df.drop(columns=["max_awt", 'mean_wait_time'])
    df = df.round(1)

    elapsed = time.perf_counter() - time_start
    print(f"Processed sim data @ {elapsed:.2f} seconds")
    # Serialize DataFrame to List ----
    data = [df.columns.tolist()] + df.values.tolist()
    data_pack["TimelineLogbooks"].setdefault("all", {})["compiled"] = data
    
    elapsed = time.perf_counter() - time_start
    print(f"Loaded sim data @ {elapsed:.2f} seconds")
    return data_pack


@app.get("/api/read-sim2")
def read_sim(path: str = Query(..., description="Path relative to public/data_dev")):
    time_start = time.perf_counter()
    data_pack = {}
    sim_path = _safe_resolve(path)
    if not sim_path.exists() or not sim_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")
    # Scan Runs inside each SimFolder
    data_pack = {
        "Zone": sim_path.parent.name,
        "SimID": sim_path.name,
        "TimelineLogbooks": {},
        "PassengerLogbooks": {},
    }
    runs = [f for f in sim_path.iterdir() if f.is_dir()]
    for run in runs:
        if run.name != "compiled": continue
        # Scan files inside each run
        files = [f for f in run.iterdir() if f.is_file() and f.name.endswith('.feather')]
        for f in files:
            # Read Timelines
            if f.name.startswith("timeline_logbook"):
                columns = ['time', 'queue_length', 'mean_wait_time', 'mean_travel_time']
                if run.name == "compiled": columns += ['min_awt', 'max_awt', 'min_att', 'max_att']
                df = pd.read_feather(f, columns = columns)
                s = pd.to_numeric(df["time"], errors="coerce") % (24 * 3600)
                df["time"] = pd.to_timedelta(s, unit="s").dt.components.apply(
                    lambda r: f"{int(r.hours):02}:{int(r.minutes):02}:{int(r.seconds):02}", axis=1
                )
                df["awt_range"] = df["max_awt"] - df["min_awt"]
                df["att_range"] = df["max_att"] - df["min_att"]
                df = df.drop(columns=["max_awt", "max_att"]).round(1)

                data = [df.columns.tolist()] + df.values.tolist()
                # df_json = df.to_dict(orient="records") #json.loads(df.to_json(orient="records"))

                lvlID = "all" if len(f.name.split("_")) == 2 else f.name.split("_")[-1].split(".")[0]
                data_pack["TimelineLogbooks"].setdefault(lvlID, {})[run.name] = data

            elif f.name.startswith("passenger_logbook"):
                df = pd.read_feather(f, columns=['wait_time', 'travel_time']).round(1)
                data = [df.columns.tolist()] + df.values.tolist()
                data_pack["PassengerLogbooks"][run.name] = data

    
    elapsed = time.perf_counter() - time_start
    print(f"Read sim data in {elapsed:.2f} seconds")
    return data_pack

@app.get("/api/file")
def get_file(path: str = Query(..., description="Path relative to public/data_dev")):
    file_path = _safe_resolve(path)
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/api/read-sim/chunks")
def read_sim_chunks(path: str = Query(..., description="Path relative to public/data_dev")):
    """Stream one DataFrame per chunk as NDJSON for progressive UI rendering."""
    sim_path = _safe_resolve(path)
    if not sim_path.exists() or not sim_path.is_dir():
        raise HTTPException(status_code=404, detail="Directory not found")

    def iter_chunks():
        runs = [f for f in sim_path.iterdir() if f.is_dir()]
        chunk_index = 0

        for run in runs:
            files = [f for f in run.iterdir() if f.is_file() and f.name.endswith('.feather')]
            for f in files:
                # Choose columns by file type so each dataframe is lean.
                if f.name.startswith("timeline_logbook"):
                    columns = ['time', 'queue_length', 'mean_wait_time', 'mean_travel_time']
                    if run.name == "compiled":
                        columns += ['min_awt', 'max_awt', 'min_att', 'max_att']
                    df = pd.read_feather(f, columns=columns)
                    if {'min_awt', 'max_awt'}.issubset(df.columns):
                        df["awt_range"] = df["max_awt"] - df["min_awt"]
                    if {'min_att', 'max_att'}.issubset(df.columns):
                        df["att_range"] = df["max_att"] - df["min_att"]
                    drop_cols = [c for c in ["max_awt", "max_att"] if c in df.columns]
                    if drop_cols:
                        df = df.drop(columns=drop_cols)
                    df = df.round(1)
                    chunk_type = "timeline"

                elif f.name.startswith("passenger_logbook"):
                    df = pd.read_feather(f, columns=['wait_time', 'travel_time']).round(1)
                    chunk_type = "passenger"

                else:
                    continue

                payload = {
                    "chunk_index": chunk_index,
                    "chunk_type": chunk_type,
                    "run": run.name,
                    "file": f.name,
                    "rows": len(df),
                    "data": [df.columns.tolist()] + df.values.tolist(),
                }
                chunk_index += 1
                
                # NDJSON: one JSON object per line.
                yield json.dumps(payload) + "\n"

        yield json.dumps({"done": True, "total_chunks": chunk_index}) + "\n"

    return StreamingResponse(iter_chunks(), media_type="application/x-ndjson")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3000"))
    uvicorn.run("python_server:app", host="0.0.0.0", port=port, reload=False)