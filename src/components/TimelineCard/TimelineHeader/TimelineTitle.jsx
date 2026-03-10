import React, { useState } from 'react';
import Fab from '@mui/material/Fab';
import Button from '@mui/material/Button';
import Man from '@mui/icons-material/Man';
import AccessTime from '@mui/icons-material/AccessTime';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import './TimelineTitle.css'

function TimelineTitle() {

    const [active, setActive] = useState([1,0,0]);
    // const inActiveStyle = {
    //     color: 'white',
    //     backgroundColor: colorConfig.primaryGrey,
    //     width: 32
    // };
    
    return (
        <div className="timeline-title-container">
            <Fab
                onClick={()=>setActive([1,0,0])}
                variant= "extended"
                aria-label="queue-length-title"
                size="small"
                color={active[0] ? 'primaryGreyInverted' : 'inactiveInverted'}
                sx={{ width: active[0] ? 185 : 32 }} //'fit-content'
            >
                <Man className="fab-icon"/>
                <span className={active[0] ? "fab-text" : "fab-text empty"}>{active[0] ? 'Queue Length' : ''}</span>
            </Fab>
            <div className='divider'>|</div>
            <Fab
                onClick={()=>setActive([0,1,0])}
                variant= "extended"
                aria-label="awt-title"
                size="small"
                color={active[1] ? 'primaryGreyInverted' : 'inactiveInverted'}
                sx={{ width: active[1] ? 134 : 32 }}
            >
                <AccessTimeFilledIcon className="fab-icon"/>
                <span className={active[1] ? "fab-text" : "fab-text empty"}>{active[1] ? 'Wait Time' : ''}</span>
            </Fab>
            <div className='divider'>|</div>
            <Fab
                onClick={()=>setActive([0,0,1])}
                variant= "extended"
                aria-label="att-title"
                size="small"
                color={active[2] ? 'primaryGreyInverted' : 'inactiveInverted'}
                sx={{ width: active[2] ? 168 : 32 }}
            >
                <AccessTime className="fab-icon"/>
                <span className={active[2] ? "fab-text" : "fab-text empty"}>{active[2] ? 'Travel Time' : ''}</span>
            </Fab>
        </div>
    );
}

export default TimelineTitle;
