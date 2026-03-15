from pathlib import Path

def read_option_meta(path: Path) -> dict:

  meta = {
    "url": None,
    "zones": {},
  }
  # Scan zones
  zones = [f for f in path.iterdir() if f.is_dir()]
  for zone in zones:
      meta["zones"][zone.name] = [f.name for f in zone.iterdir() if f.is_dir()]
  
  return meta