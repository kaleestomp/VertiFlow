import streamlit as st
from pathlib import Path, WindowsPath
import pandas as pd
from xml_utilites import fetch_all_level_table
URL = r"C:\Users\kylec\OneDrive\Desktop\react_project\my-tutorial\vertiflow\public\data_dev\Project1\Direct-3Zone-DD-Lunch"
XML_FILES = {
    "LOW": Path(URL) / "South Tower - Office - Low Zone.elvx",
    "MID": Path(URL) / "South Tower - Office - Mid Zone.elvx",
    "HIGH": Path(URL) / "South Tower - Office - High Zone.elvx"
}
st.set_page_config(
    page_title="VTPortal",
    page_icon=":material/database:",
    initial_sidebar_state = "expanded",
    layout = "wide" 
)

param = fetch_all_level_table(XML_FILES)
st.write(param)