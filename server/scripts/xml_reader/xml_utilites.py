import pandas as pd
from pathlib import Path, WindowsPath
import xml.etree.ElementTree as ET
import scripts.xml_reader.config as config


# ---- 0.1.1 Load XML File ----
def parse_xml(xml_file) -> ET.Element:
    # ---- Load XML from a file ---- 
    if isinstance(xml_file, str) or isinstance(xml_file, WindowsPath):
        tree = ET.parse(xml_file)
    else:
        xml_file.seek(0) 
        tree = ET.parse(xml_file)
    root = tree.getroot()

    return root

def fetch_zone_level_table(xml_file, name:str = None) -> pd.DataFrame:
    # ---- Load XML from a file ---- 
    root = parse_xml(xml_file)
    
    # ---- Find Floor Attributes ----
    floors = []
    elems_floor = root.findall('BuildingData/Floor')
    # Ensure elems_floor is a list even if no floors are found
    if elems_floor is None: elems_floor = []
    for floor in elems_floor:
        floors.append(floor.attrib)
    type_ref = config.ELVX_DATATYPE.get("FloorData", {})
    for floor_attrib in floors:
        parse_dict_data_type(floor_attrib, type_ref)
    df_floors = pd.DataFrame(floors)
    df_floors["FloorName"] = df_floors["FloorName"].str.title()
    df_floors["FloorLevel"] = df_floors["FloorLevel"].round(3)
    df_floors.sort_values(by="FloorLevel", inplace=True)

    if not name and hasattr(xml_file, 'stem'):
        name = xml_file.stem
    elif not name and hasattr(xml_file, 'name'):
        name = xml_file.name
    elif not name: name = "Unknown"
    df_floors.insert(0, "Zone", name)

    return df_floors[[
        "Zone",
        "FloorName", 
        "FloorLevel", 
        "NoOfPeople", 
        "EntranceFloor", 
    ]]

def fetch_all_level_table(xml_files:dict) -> pd.DataFrame:
    all = []
    for name, xml_file in xml_files.items():
        df_floor = fetch_zone_level_table(xml_file, name)
        # if 'merged_table' not in locals():
        all.append(df_floor)
    df_all = pd.concat(all, ignore_index=True)
    df_all = df_all.groupby("FloorLevel").agg({
        "Zone": lambda x: ", ".join(x),
        "FloorName": "first",
        "NoOfPeople": "sum",
        "EntranceFloor": "max",
    }).reset_index()

    return df_all[[
        "Zone",
        "FloorName", 
        "FloorLevel", 
        "NoOfPeople", 
        "EntranceFloor",
    ]]

# Helper Function to Update Zone Breakdown
def parse_dict_data_type(data_dict:dict, type_ref:dict, recursive:bool = True) -> dict:
    for key, value in data_dict.items():
        if isinstance(value, dict):
            if recursive:
                parse_dict_data_type(value, type_ref, recursive=recursive)
            continue
        if isinstance(value, list):
            if recursive:
                for item in value:
                    if isinstance(item, dict):
                        parse_dict_data_type(item, type_ref, recursive=recursive)
            continue
        datatype = type_ref.get(key, None)
        if datatype is None:
            continue
        if isinstance(datatype, str):
            datatype = config.TYPE_ALIASES.get(datatype, datatype)
        data_dict[key] = parse_value(value, datatype)
    return data_dict

def parse_value(value, datatype):
    try:
        if callable(datatype):
            return datatype(value)
        else:
            return value
    except:
        return value

