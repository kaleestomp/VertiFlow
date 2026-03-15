import pandas as pd
from pathlib import Path, WindowsPath
from collections import defaultdict
# import streamlit as st
import xml.etree.ElementTree as ET
import datetime
import config as config
from io import StringIO


# ---- 0.1.1 Load XML File ----

def get_param_summary_dict(xml_file, file_name) -> dict:
    '''
    For each uploaded file, attributes exits at 2 levels:
    0. Option Level Attributes (user attributes not extracted in this function)
    1. File Level Attributes (e.g. Building Attributes, Master Config Attributes)
    2. Coniguration Attributes (e.g. KPI Results for each configuration)
        Each Elevate file may contain multiple simulation results identified by SimulationID
    '''
    print(f"Processing file: {file_name}")
    # ---- Load XML from a file ---- 
    # Check if xml_file is a string (file path) or a file object
    if isinstance(xml_file, str) or isinstance(xml_file, WindowsPath):
        # If it's a file path string, parse directly
        tree = ET.parse(xml_file)
    else:
        # file_name = xml_file.name if hasattr(xml_file, 'name') else None
        xml_file.seek(0) 
        tree = ET.parse(xml_file)
    
    root = tree.getroot()
    master_dict = get_building_attributes(root) 

    # ---- Level 1 Attribute (File) ----
    file_name
    building_dict = master_dict["building_dict"]
    floor_dict = master_dict["floor_dict"]
    level_register = [float(floor.get("FloorLevel", 0)) for floor in floor_dict.values()]
    unique_car_attrib_list = get_car_attributes(root, floor_dict)
    highiest_floor = get_highiest_level_served(unique_car_attrib_list, floor_dict)
    # highiest_floor = xml_utilities.get_highiest_level_served_simple(root, floor_dict)
    master_config_dict = get_master_configurations(root)
    result_dict = get_kpis(root, master_config_dict)
    run_register = get_run_regiester(root)
    passenger_attrib = get_passenger_attributes(root)

    # ---- File Attribute ----
    file_attrib = {
        'FileName': file_name,
        # 'CustomName': zone_data.get("CustomName", None),
    }
    # ---- Building Attributes ----
    building_attrib = {
        key: value for key, value in building_dict.items() if not isinstance(value, dict)
    }
    building_attrib.update({
        'HighestFloor': highiest_floor.get("FloorName", None),
        'HighestFloorLevel': highiest_floor.get("FloorLevel", None),
        'FloorRange': f"{len(floor_dict)} flrs (~{highiest_floor.get('FloorName', None)})" if floor_dict else None,
        'TravelDistance': max(level_register) - min(level_register) if level_register else None,
        'Population': sum([int(floor.get("NoOfPeople", 0)) for floor in floor_dict.values()]),
    }) #<-- Update imported param by adding new attributes and removing dict type attributes

    # ---- Master Config Attributes ----
    master_config_attrib = {
        key: value for key, value in master_config_dict.items() if not isinstance(value, dict)
    }
    master_config_attrib.update({
        'NoOfConfigurations': len(result_dict),
        'Runs': len(run_register),
    })

    # ---- Compile Level 1 Attributes ----
    attrib_l1 = file_attrib | building_attrib | master_config_attrib | passenger_attrib

    # ---- Level 2 Attribute (Configuration) ----
    config_dictlist = []
    for lift_count, config_data in result_dict.items():
        config_attrib = {
            key: value for key, value in config_data.items() if not isinstance(value, dict)
        }
        config_attrib.update({
            "NoOfLifts": int(lift_count),
            "ATD": float(config_attrib.get("AWT", 0)) + float(config_attrib.get("ATT", 0)),
        })
        config_dictlist.append(config_attrib.copy())
    config_keys = next(iter(config_dictlist), {}).keys() if config_dictlist else []
    attrib_l2 = {key: [d[key] for d in config_dictlist] for key in config_keys}
    # Dataframe aggregation method didnt work here Not sure why
    
    # ---- Combbine Level 1 & 2 Attributes ----
    attrib = attrib_l1 | attrib_l2

    return attrib

def fetch_parameter_data(xml_file, file_name) -> dict:
    """
    Load an XML file and parse it to extract parameter data.

    Args:
        xml_file (str/IO): Path to the XML file or XML File Objet.
        If no file_name is provided it will be extracted from the file object.

    Returns:
        dict: Dictionary containing the parsed parameter data.
    """
    zone_data = {}
    floor_collection = {}
    # ---- Load XML from a file ---- 
    tree = ET.parse(xml_file)
    root = tree.getroot()

    # ---- Find Building Attributes ---- 
    master_dict = get_building_attributes(root) 
    building_attrib = master_dict["building_dict"]
    floor_collection = master_dict["floor_dict"]

    # ---- Find Elevator Attributes ----
    unique_car_attrib_list = get_car_attributes(root, floor_collection)
    cross_reference_floor_attrib(unique_car_attrib_list, floor_collection)
    cross_reference_express_zone(unique_car_attrib_list, building_attrib)
    building_attrib["HighestFloor"] = get_highiest_level_served(unique_car_attrib_list, floor_collection)

    # ---- Find Configurations ----
    master_config = get_master_configurations(root)

    # ---- Find KPIs ----
    results = get_kpis(root, master_config)

    # ---- Find ResultsFile to Get Runs ----
    run_register = get_run_regiester(root)

    # ---- Compiled Data to Dictionary ----
    param = {
        'ZoneData': { file_name: {
            # 'CustomName': file_name,
            'BuildingData': building_attrib,
            'CarData': unique_car_attrib_list,
            'Results': results,
            'MasterConfigs': master_config,
            'RunRegister': run_register,
            }},
        'FloorData': floor_collection,
    }

    errors = validate_and_update_floor_served_per_car(param)
    # if errors: st.warning(errors)
    
    return param

def validate_and_update_floor_served_per_car(param:dict) -> str:
    # Extract Floor Data from XML ----
    zone_schema = param.get("FloorData", {})
    for zone_key, zone_attrib in param.get("ZoneData", {}).items():
        unique_cars = zone_attrib.get("CarData", [])
        for car_data in unique_cars:
            floor_dicts = car_data.get("FloorServed", [])
            #^ List of Dictionaries containing basic info about the floor being serverd
            # Example: [{
                # "FloorName":"Level 56"
                # "FloorIndex":"56"
                # "Doors":"Front Doors"
            # }, ...]
            for floor_dict in floor_dicts:
                if floor_dict["FloorName"] not in zone_schema.keys():
                    return f"Lift serving floor not defined in Building Schema: {floor_dict['FloorName']}"
    return None

def get_param_summary_dict_from_param(param_data:dict) -> dict:
    '''
    For each uploaded file, attributes exits at 2 levels:
    0. Option Level Attributes (user attributes not extracted in this function)
    1. File Level Attributes (e.g. Building Attributes, Master Config Attributes)
    2. Coniguration Attributes (e.g. KPI Results for each configuration)
        Each Elevate file may contain multiple simulation results identified by SimulationID
    '''
    # attrib_list = [] #<-- List of Level 2 Attributes in dict format to be converted to DataFrame
    param_attrib = {} #<-- Level 2 Attributes in dict format
    zone_param = param_data.get('ZoneData', {})
    floor_param = param_data.get('FloorData', {})
    for file_name, zone_data in zone_param.items():
        # ---- Level 1 Attribute (File) ----
        building_data = zone_data.get("BuildingData", {})
        floor_register = building_data.get("Floors", [])
        highiest_floor_data = building_data.get("HighestFloor", {})
        master_config_data = zone_data.get("MasterConfigs", {})
        result_data = zone_data.get("Results", {})
        floor_data = {floor_name: floor_param.get(floor_name, {}) for floor_name in floor_register}
        level_register = [float(floor.get("FloorLevel", 0)) for floor in floor_data.values()]

        # ---- File Attribute ----
        file_attrib = {
            'FileName': file_name,
            # 'CustomName': zone_data.get("CustomName", None),
        }
        
        # ---- Building Attributes ----
        building_attrib = {
            key: value for key, value in building_data.items() if not isinstance(value, dict)
        }
        building_attrib.update({
            'HighestFloor': highiest_floor_data.get("FloorName", None),
            'FloorRange': f"{len(floor_register)} flrs (~{highiest_floor_data.get('FloorName', '')})" if floor_register else None,
            'TravelDistance': max(level_register) - min(level_register) if level_register else None,
            'Population': sum([int(floor.get("NoOfPeople", 0)) for floor in floor_data.values()]),
        }) #<-- Update imported param by adding new attributes and removing dict type attributes

        # ---- Master Config Attributes ----
        master_config_attrib = {
            key: value for key, value in master_config_data.items() if not isinstance(value, dict)
        }
        master_config_attrib.update({
            'NoOfConfigurations': len(result_data),
            'Runs': len(zone_data.get("RunRegister", [])),
        })

        # ----  Car Attributes ----
        # Car Attributes isnt needed in most instance as they seemd to be indicated by master configurations

        # ---- Compile Level 1 Attributes ----
        attrib_l1 = file_attrib | building_attrib | master_config_attrib

        # ---- Level 2 Attribute (Configuration) ----
        config_dictlist = []
        for lift_count, config_data in result_data.items():
            config_attrib = {
                key: value for key, value in config_data.items() if not isinstance(value, dict)
            }
            config_attrib.update({
                "NoOfLifts": int(lift_count),
                "ATD": float(config_attrib.get("AWT", 0)) + float(config_attrib.get("ATT", 0)),
            })
            config_dictlist.append(config_attrib.copy())
        config_keys = next(iter(config_dictlist), {}).keys() if config_dictlist else []
        attrib_l2 = {key: [d[key] for d in config_dictlist] for key in config_keys}
        # Dataframe aggregation method didnt work here Not sure why
        
        # ---- Combbine Level 1 & 2 Attributes ----
        attrib = attrib_l1 | attrib_l2
        param_attrib[file_name] = attrib.copy()
        # attrib_list.append(attrib.copy())

    return param_attrib

def update_summary(summary_table:pd.DataFrame, param_data:dict):
    summary_table["Levels"] = None
    summary_table["Speed"] = None
    summary_table["Capacity"] = None
    summary_table["AWT"] = None
    summary_table["ATD"] = None
    for i, row in summary_table.iterrows():
        file_name = row['File']
        zone_data = param_data['ZoneData'][file_name]
        floors = zone_data["BuildingData"]["Floors"]
        highiest_floor = param_data['ZoneData'][file_name]["BuildingData"]["HighestFloor"]["FloorName"]
        capacity = [float(car_dict["Capacity"]) for car_dict in zone_data["CarData"]]
        speed = [float(car_dict["Speed"]) for car_dict in zone_data["CarData"]]
        awt_list = [round(float(zone_data['Results'][car_option]['AWT'])) for car_option in zone_data['Results'].keys()]
        att_list = [round(float(zone_data['Results'][car_option]['ATT'])) for car_option in zone_data['Results'].keys()]
        atd_list = [awt + att for awt, att in zip(awt_list, att_list)]

        summary_table.at[i, "Levels"] = f"{len(floors)} flrs (~{highiest_floor})" if floors else None
        summary_table.at[i, "Speed"] = f"{', '.join([f'{v:.1f}' for v in speed])} m/s" if speed else None
        summary_table.at[i, "Capacity"] = f"{', '.join([f'{m:.1f}' for m in capacity])} kg" if capacity else None
        summary_table.at[i, "AWT"] = awt_list #f"{', '.join([str(v) for v in awt_list])}s" if awt_list else None
        summary_table.at[i, "ATD"] = atd_list #f"{', '.join([str(v) for v in atd_list])}s" if atd_list else None

    return summary_table

# -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# ---- 0.1.2 Parse XML ----
def get_building_attributes(root, type_ref:dict = config.ELVX_DATATYPE) -> dict:
    building_dict = {}
    floor_dict = {}
    # ---- Find Building Attributes ----
    elem_building_data = root.find('BuildingData')
    building_dict = elem_building_data.attrib if elem_building_data is not None else {}
    # ---- Find Floor Attributes ----
    building_dict["Floors"] = []
    elems_floor = root.findall('BuildingData/Floor')
    # Ensure elems_floor is a list even if no floors are found
    if elems_floor is None: elems_floor = []
    for floor in elems_floor:
        floor_name = floor.attrib['FloorName']#.title() This messes with other name formatting in car attributes for example
        building_dict["Floors"].append(floor_name)

        floor_attrib = floor.attrib
        floor_attrib.pop('FloorName', None)
        floor_attrib["FloorLevel"] = round(float(floor_attrib.get("FloorLevel", 0)), 3)
        floor_dict[floor_name] = floor_attrib

    parse_dict_data_type(building_dict, type_ref.get("BuildingData", {}))
    for floor_attrib in floor_dict.values():
        parse_dict_data_type(floor_attrib, type_ref.get("FloorData", {}))

    return {"building_dict": building_dict, "floor_dict": floor_dict}

def get_car_attributes(root, floor_collection:dict, type_ref:dict = config.ELVX_DATATYPE) -> list[dict]:
    # Fetch Car Attributes ----
    elems_car = root.findall('ElevatorData/Advanced/Configuration/Car')
    car_attrib_list = []
    attib_id_list = []
    for car in elems_car:
        car_attrib = car.attrib
        car_attrib['FloorServed'] = [floor.attrib for floor in car.findall('FloorServed')]
        # Generate unique car ID to describe attributes
        attib_id_list.append("-".join([foor["FloorName"].replace(" ", "") for foor in car_attrib['FloorServed']]))
        car_attrib_list.append(car_attrib)

    # ---- Find Unique Elevator Attributes ----
    results = defaultdict(list)
    for car_attrib, attrib_id in zip(car_attrib_list, attib_id_list):
        results[attrib_id].append(car_attrib)
    car_attrib_grouped = list(dict(results).values())

    unique_car_attrib_list = []
    for group in car_attrib_grouped:
        id_list = [car_attrib["Id"] for car_attrib in group]
        unique_car_attrib = group[0]  # Take the first car's attributes as representative
        unique_car_attrib.pop('Id', None)  # Remove the Id attribute
        unique_car_attrib['Ids'] = id_list  # Store the list of IDs
        unique_car_attrib_list.append(unique_car_attrib)

    unique_car_attrib_list = sort_car_order(unique_car_attrib_list, floor_collection)

    for car_attrib in unique_car_attrib_list:
        parse_dict_data_type(car_attrib, type_ref.get("CarData", {}))
        for floor in car_attrib['FloorServed']:
            parse_dict_data_type(floor, type_ref.get("FloorData", {}))

    return unique_car_attrib_list

def cross_reference_floor_attrib(unique_car_attrib_list:list, floor_collection:dict) -> bool:

    for car_attrib in unique_car_attrib_list:
        floor_served = car_attrib.get("FloorServed", [])
        for floor in floor_served:
            floor_name = floor["FloorName"]
            floor.update(floor_collection[floor_name])

def cross_reference_express_zone(unique_car_attrib_list:list, building_attrib:dict) -> dict:
    # Check if Express Zone is Enabled ----
    if building_attrib.get("Express", 0) == 0: return
    
    # Fetch Express Zone Positions ----
    express_start = round(building_attrib.get("ExpressStartPosition", 0), 3)
    express_end = round(building_attrib.get("ExpressEndPosition", 0), 3)
    for car_attrib in unique_car_attrib_list:
        floor_served = []
        for floor in car_attrib.get("FloorServed", []):
            if round(floor["FloorLevel"], 3) < express_start or round(floor["FloorLevel"], 3) > express_end:
                floor_served.append(floor)
        car_attrib["FloorServed"] = floor_served

def sort_car_order(car_data: list[dict], floor_collection: dict) -> list[dict]:
    """
    Sort car data based on the highiest floor level served.

    Args:
        car_data (list[dict]): List of dictionaries containing car data.
        floor_data (dict): Dictionary containing floor data with floor names as keys.

    Returns:
        list[dict]: Sorted list of car data.
    """
    car_data_sorted = sorted(car_data, 
        # Sort KEY is a list of float - each represents that highiest floor levels served by assciated car
        key = lambda car: max([float(floor_collection[floor["FloorName"]]["FloorLevel"]) for floor in car["FloorServed"]]))

    return car_data_sorted

def get_highiest_level_served(unique_car_attrib_list:list[dict], floor_collection:dict) -> dict:
    # ---- Find Highiest Floor Served by Each Car ----
    for car_attrib in unique_car_attrib_list:
        #floors_served = [floor["FloorName"] for floor in car_attrib['FloorServed']]
        floors_level_served = [float(floor_collection[floor["FloorName"]]["FloorLevel"]) for floor in car_attrib['FloorServed']]
        #car_attrib['HighestFloorServedIndex'] = floors_level_served.index(max(floors_level_served)) if floors_level_served else None
        if floors_level_served:
            max_flr_idx = floors_level_served.index(max(floors_level_served))
            max_flr = car_attrib['FloorServed'][max_flr_idx]['FloorName']
            car_attrib['HighiestFloor'] = floor_collection[max_flr]
            car_attrib['HighiestFloor']['FloorName'] = max_flr # Add FloorName back in since it was removed earlier from floor attributes
        else:
            car_attrib['HighiestFloor'] = None

    # ---- Find Highiest Floor Level Served by All Cars ----
    max_flr_all_cars = [car_attrib['HighiestFloor'] for car_attrib in unique_car_attrib_list]
    max_flr_lvl_all_cars = [float(car_attrib['HighiestFloor']['FloorLevel']) for car_attrib in unique_car_attrib_list]
    max_flr_sorted = [value for key, value in sorted(zip(max_flr_lvl_all_cars, max_flr_all_cars), reverse=True)]
    highest_floor = max_flr_sorted[0] if max_flr_sorted else None
    
    return highest_floor

def get_highiest_level_served_simple(root, floor_dict:dict) -> dict:
    highest_floor_served_dict = {}
    elems_car = root.findall('ElevatorData/Advanced/Configuration/Car')
    max_level = 0
    for car in elems_car:
        car_attrib = car.attrib
        car_attrib['FloorServed'] = [floor.attrib for floor in car.findall('FloorServed')]
        floors_level_served = [float(floor_dict[floor["FloorName"]]["FloorLevel"]) for floor in car_attrib['FloorServed']]
        if floors_level_served and max(floors_level_served) > max_level:
            max_level = max(floors_level_served)
            max_flr_idx = floors_level_served.index(max_level)
            max_flr_name = car_attrib['FloorServed'][max_flr_idx]['FloorName']
            highest_floor_served_dict = floor_dict[max_flr_name]
            highest_floor_served_dict["FloorName"] = max_flr_name
    return highest_floor_served_dict

def get_master_configurations(root, type_ref:dict = config.ELVX_DATATYPE) -> dict:
    elem_standard = root.findall('ElevatorData/Standard')
    master_config = elem_standard[0].attrib if elem_standard else None
    parse_dict_data_type(master_config, type_ref.get("MasterConfigs", {}))
    
    return master_config

def get_kpis(root, master_config:dict, type_ref:dict = config.ELVX_DATATYPE) -> dict:
    results = {}        
    elems_config = root.findall('Results/Configs/Config')
    # Ensure elems_floor is a list even if no floors are found
    if elems_config is None: elems_config = []

    car_options = [i for i in range(int(master_config['MinNoOfLifts']), int(master_config['MaxNoOfLifts']) + 1)]
    for i, config in enumerate(elems_config):
        results[car_options[i]] = config.attrib
    
    parse_dict_data_type(results, type_ref.get("Results", {}))

    return results

def get_run_regiester(root) -> list:
    elems_config = root.findall('Results/ResultsFile/Pointer')
    # Ensure elems_floor is a list even if no floors are found
    if elems_config is None: elems_config = []
    run_dicts = [config.attrib for config in elems_config]
    run_register = [run_data.get('Run', None) for run_data in run_dicts if run_data.get('Run', None) is not None]
    run_register = list(set(run_register)) # Unique Run IDs
    return run_register

def get_passenger_attributes(root, type_ref:dict = config.ELVX_DATATYPE) -> dict:
    #.find returns the first matching element
    #.findall returns a list of all matching elements
    elems_passenger = root.find('PassengerData/Standard')
    passenger_attrib = elems_passenger.attrib if elems_passenger is not None else {}
    parse_dict_data_type(passenger_attrib, type_ref.get("Passenger", {}))
    
    # Construct datetime object from hour and minute attributes
    start_time = datetime.time(hour=passenger_attrib["StartTimeHours"], minute=passenger_attrib["StartTimeMins"])
    end_time = datetime.time(hour=passenger_attrib["EndTimeHours"], minute=passenger_attrib["EndTimeMins"])
    duration = datetime.datetime.combine(datetime.date.min, end_time) - datetime.datetime.combine(datetime.date.min, start_time)
    
    # Store as JSON-serializable strings and numbers
    passenger_attrib["StartTime"] = start_time.strftime("%H:%M:%S")
    passenger_attrib["EndTime"] = end_time.strftime("%H:%M:%S")
    passenger_attrib["Duration"] = str(datetime.timedelta(seconds=duration.total_seconds()))
    passenger_attrib["DurationHours"] = duration.total_seconds() / 3600
    passenger_attrib["DurationMins"] = duration.total_seconds() / 60

    return passenger_attrib

# ---- 0.2.0 Merge XML File ----
def fetch_parameter_data_multiple(xml_dict:dict) -> dict:
    
    """
    Load an XML file and parse it to extract parameter data.

    Args:
        xml_file (str/IO): Path to the XML file or XML File Objet.

    Returns:
        dict: Dictionary containing the parsed parameter data.
    """
    param_collection = []
    for name, xml_file in xml_dict.items():
        param_collection.append(fetch_parameter_data(xml_file, name))
    param_data = merge_parameter_data(param_collection)

    return param_data

def merge_parameter_data(param_collection: list[dict]) -> dict:
    """
    Merge multiple XML files into a single dictionary.

    Args:
        param_data (list[dict]): List of dictionaries containing XML file paths or objects.

    Returns:
        dict: Merged dictionary containing the parsed parameter data.
    """
    # ---- Compile Data ----
    param_data = {
        'ZoneData': merge_zone_collections([param.get('ZoneData', {}) for param in param_collection]),
        'FloorData': merge_floor_collections([param.get('FloorData', {}) for param in param_collection]),
        # 'ProgramList': zone_type_list,
    }

    return param_data

def merge_floor_collections(list_of_floor_collections: list[dict]) -> dict:
    merged_collection = {}
    for floor_collection in list_of_floor_collections:
        for floor_name, floor in floor_collection.items():
            # Check if the floor exists in the dictionary but RL does not match 
            rl_mismatch = floor_name in floor_collection.keys() and round(float(floor['FloorLevel']), 3) != round(float(floor_collection[floor_name]['FloorLevel']), 3)
            #name_mismatch = floor_name not in floor_attrib_dict.keys() and float(floor.attrib['FloorLevel']) in [float(f['FloorLevel']) for f in floor_attrib_dict.values()]
            if rl_mismatch: 
                # st.warning(f"Floor '{floor_name}' has a level mismatch: {floor['FloorLevel']} vs {floor_collection[floor_name]['FloorLevel']}. Check whether parameters files are from the same model.")
                floor_name = f"{floor_name}_duplicate"
            # Add floor attributes to the dictionary 
            merged_collection[floor_name] = floor
    
    # ---- Sort Floor Dictionary by FloorLevel ----
    floor_lvls = [float(floor['FloorLevel']) for floor in merged_collection.values()]
    floor_names = list(merged_collection.keys())
    sorted_names = [v for _, v in sorted(zip(floor_lvls, floor_names))]
    floors_sorted = {name: merged_collection[name] for name in sorted_names}
    
    return floors_sorted

def merge_zone_collections(list_of_zone_collections: list[dict]) -> dict:
    merged_collection = {}
    for zone_collection in list_of_zone_collections:
        merged_collection.update(zone_collection)

    # ---- Sort Zone Dictionary by Highest Floor Level ----
    sort_items = list(merged_collection.keys())
    sort_keys = [zone_data['BuildingData']['HighestFloor']['FloorLevel'] for zone_data in merged_collection.values()]
    sort_order = [value for _, value in sorted(zip(sort_keys, sort_items), reverse=False)]
    zone_dict_sorted = {key: merged_collection[key] for key in sort_order if key in merged_collection}

    return zone_dict_sorted

def identify_zone_breakdown(zone_dict_sorted: dict, floor_dict_sorted: dict) -> list[dict]:
    """
    Identify the breakdown of zones by cross-referencing floor attributes and core attributes.

    Args:
        zone_dict (dict): Dictionary containing zone data.
        floor_dict (dict): Dictionary containing floor data.

    Returns:
        list[dict]: List of dictionaries containing zone breakdown.
    """
    zone_type_list = []
    current_zone = {"Core":None, "Type":None, "Floors":[], "FloorIndex":[], "Color": None}
    
    # Iterate Through Floors
    for i, (floor_name, floor_attrib) in enumerate(floor_dict_sorted.items()):
        # ---- Find Servicing Cores ----
        core_serving = []
        for zone_name, zone_data in zone_dict_sorted.items():
            floors_served = zone_data['BuildingData']['Floors'] # List of floor named served by the core
            if floor_name in floors_served: core_serving.append(zone_name)
        primary_core = core_serving[0]

        # ---- This is an entry floor ----
        entrance_floor = parse_bool(floor_attrib.get('EntranceFloor'))
        if entrance_floor is True:
            # floor_type_dict.setdefault("Entry", []).append(floor_name)
            # floor_attrib['Type'] = "Entry"
            zone_type_list, current_zone = update_zone_breakdown("Entry", zone_type_list, current_zone, primary_core, floor_name, i)
            continue
        # ---- Population is Zero ----
        no_of_people = parse_value(floor_attrib.get('NoOfPeople', 0), int)
        if no_of_people == 0:
            zone_type_list, current_zone = update_zone_breakdown("Service", zone_type_list, current_zone, primary_core, floor_name, i)
            continue
        # ---- Served by multiple cores ----
        if len(core_serving) > 1:
            zone_type_list, current_zone = update_zone_breakdown("InterChange", zone_type_list, current_zone, primary_core, floor_name, i)
            continue
        # ---- Not Served by any core ----
        elif len(core_serving) == 0:
            zone_type_list, current_zone = update_zone_breakdown("NotServed", zone_type_list, current_zone, primary_core, floor_name, i)
            continue
        # ---- Typical ----
        else:
            zone_type_list, current_zone = update_zone_breakdown("Typical", zone_type_list, current_zone, primary_core, floor_name, i)
        
        # ---- This is the last floor in the list ----
        if i == len(list(floor_dict_sorted.keys())) - 1:
            zone_type_list.append(current_zone)

    return zone_type_list

# Helper Function to Update Zone Breakdown
def update_zone_breakdown(type, zone_type_list, current_zone, primary_core, floor_name, floor_index):
    color_dict = {"Entry": "rgb(166,139,187)", "Service": "rgb(180,180,180)", "InterChange": "rgb(31,130,192)", "NotServed": "rgb(255,255,255)", "Typical": "rgb(188,213,236)"}
    color = color_dict[type] if type in color_dict else "rgb(255,255,255)" # Default color if type not found
    # This is the first floor in the series
    if current_zone["Type"] is None: 
        current_zone = {"Core": primary_core, "Type": type, "Floors": [floor_name], "FloorIndex":[floor_index], "Color": color } # Initialize a new current zone
    # This is a new zone
    elif current_zone['Type'] != type or current_zone['Core'] != primary_core: 
        zone_type_list.append(current_zone) # Append the last current zone to the list
        current_zone = {"Core": primary_core, "Type": type, "Floors": [floor_name], "FloorIndex":[floor_index], "Color": color } # Initialize a new current zone
    # This is a continuation of the current zone
    else: 
        current_zone["Floors"].append(floor_name)
        current_zone["FloorIndex"].append(floor_index)

    return zone_type_list, current_zone

def parse_param_data_type(param_data:dict, reference_dict:dict = config.ELVX_DATATYPE):
    # ---- Parse Parameter Data Types ----
    # ---- Zone Data ----
    zone_param = param_data.get('ZoneData', {})
    for zone_data in zone_param.values():
        # ---- Building Data ----
        data_dict = zone_data.get("BuildingData", {})
        type_ref = reference_dict.get("BuildingData", {})
        parse_dict_data_type(data_dict, type_ref)
        # ---- HighestFloor Data ----
        data_dict = zone_data.get("BuildingData", {}).get("HighestFloor", {})
        type_ref = reference_dict.get("FloorData", {})
        parse_dict_data_type(data_dict, type_ref)

        # ---- Configuration Data ----
        data_dict = zone_data.get("MasterConfigs", {})
        type_ref = reference_dict.get("MasterConfigs", {})
        parse_dict_data_type(data_dict, type_ref)
        
        # ---- Results Data ----
        data_dict = zone_data.get("Results", {})
        type_ref = reference_dict.get("Results", {})
        parse_dict_data_type(data_dict, type_ref)
        
        # ---- Car Data ----
        type_ref = reference_dict.get("CarData", {})
        for data_dict in zone_data.get("CarData", []):
            parse_dict_data_type(data_dict, type_ref)

    # ---- Floor Data ----
    floor_param = param_data.get('FloorData', {})
    type_ref = reference_dict.get("FloorData", {})
    for floor_data in floor_param.values():
        parse_dict_data_type(floor_data, type_ref)

    return None

def parse_bool(value):
    
    if isinstance(value, bool):
        return value
    value_str = str(value).strip().lower()
    if value_str in {"true", "1", "yes", "y", "t"}:
        return True
    if value_str in {"false", "0", "no", "n", "f"}:
        return False
    return None

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

