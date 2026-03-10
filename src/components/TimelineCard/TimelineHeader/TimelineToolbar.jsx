import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import FilterNone from '@mui/icons-material/FilterNone';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import UnfoldMore from '@mui/icons-material/UnfoldMore';
import UnfoldLess from '@mui/icons-material/UnfoldLess';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import LayersIcon from '@mui/icons-material/Layers';
import JoinFullRoundedIcon from '@mui/icons-material/JoinFullRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';

function TLHeaderToolbar() {
    const [showIndividual, setShowIndividual] = useState(false);
    const [showLayers, setShowLayers] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [open, setOpen] = useState(true);
    // const [expanded, setExpanded] = useState(false);

    return (
        <div className="timeline-toolbar-container">
            <IconButton 
                onClick={()=>{setShowIndividual(!showIndividual)}}
                color={showIndividual ? "primaryGrey" : "inactive"}
                size="medium"
                aria-label="show-individual"
            >
                <QueryStatsRoundedIcon fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setShowInfo(!showInfo)}}
                color={showInfo ? "primaryGrey" : "inactive"} 
                size="medium"
                aria-label="show-info"
            >
                <AnnouncementIcon fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setShowLayers(!showLayers)}}
                color={showLayers ? "primaryGrey" : "primaryGrey"}
                size="medium"
                aria-label="show-settings"
            >
                <LayersIcon fontSize="inherit" />
            </IconButton>
            <IconButton 
                onClick={()=>{setOpen(!open)}}
                color={open ? "primaryGrey" : "primaryGrey"} 
                size="medium"
                aria-label="show-open"
            >
                {open ? <CloseIcon fontSize="inherit" /> : <OpenInNewIcon fontSize="inherit" />}
            </IconButton>
            {/* <IconButton 
                onClick={()=>{setExpanded(!expanded)}}
                color={expanded ? "primary" : "inactive"} 
                size="medium"
                aria-label="show-expanded"
            >
                {expanded ? <UnfoldLess fontSize="inherit" /> : <UnfoldMore fontSize="inherit" />}
            </IconButton> */}
        </div>
    );
}

export default TLHeaderToolbar;
