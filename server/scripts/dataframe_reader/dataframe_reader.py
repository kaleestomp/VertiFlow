import time
import pandas as pd
from pathlib import Path, WindowsPath
from scripts.xml_reader.xml_utilites import fetch_all_level_table

SERVER_DIR = Path(__file__).resolve().parent
DATA_DIR = (SERVER_DIR / "../public/data_dev").resolve()


def fetch_timeline(sim_path: WindowsPath) -> dict:
    
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