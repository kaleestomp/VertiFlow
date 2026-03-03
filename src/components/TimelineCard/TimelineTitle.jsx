import React, { useEffect, useState } from 'react';
import Fab from '@mui/material/Fab';
import Man from '@mui/icons-material/Man';
import AccessTime from '@mui/icons-material/AccessTime';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import { colorConfig } from '../../utils/Config';

function TimelineTitle() {

    const [active, setActive] = useState([1,0,0]);
    const inActiveStyle = {
        color: 'white',
        backgroundColor: colorConfig.primaryGrey,
        width: 32
    };
    const activeStyle = {
        color: 'white',
        backgroundColor: colorConfig.primaryBlue
    };
    
    return (
        <div className="timeline-title-container">
            <Fab
                onClick={()=>setActive([1,0,0])}
                variant= "extended"
                aria-label="queue-length-title"
                size="small"
                style={ active[0] ? {...activeStyle, width: 172} : inActiveStyle }
            >
                <Man sx={active[0] ? { mr: 1 } : { mr: -1}}/>
                <span className="fab-text">{active[0] ? 'Queue Length' : ''}</span>
            </Fab>
            <Fab
                onClick={()=>setActive([0,1,0])}
                variant= "extended"
                aria-label="awt-title"
                size="small"
                style={ active[1] ? {...activeStyle, width: 131} : inActiveStyle }
            >
                <AccessTimeFilledIcon sx={active[1] ? { mr: 1 } : { mr: -1}}/>
                <span className="fab-text">{active[1] ? 'Wait Time' : ''}</span>
            </Fab>
            <Fab
                onClick={()=>setActive([0,0,1])}
                variant= "extended"
                aria-label="att-title"
                size="small"
                style={ active[2] ? {...activeStyle, width: 158} : inActiveStyle }
            >
                <AccessTime sx={active[2] ? { mr: 1 } : { mr: -1}}/>
                <span className="fab-text">{active[2] ? 'Transit Time' : ''}</span>
            </Fab>
        </div>
    );
}

export default TimelineTitle;
