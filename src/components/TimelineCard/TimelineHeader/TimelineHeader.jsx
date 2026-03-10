import React, { useEffect, useState } from 'react';
import Pagination from '@mui/material/Pagination';
import TimelineToolbar from './TimelineToolbar';
import TimelineTitle from './TimelineTitle';
import ScenarioSelector from './ScenarioSelector';
import './TimelineHeader.css';

function TimelineHeader({ simData }) {

    return (
        <div className="timeline-header-container">
            <div className="left">
                <TimelineTitle />
            </div>
            <div className="center">
                <ScenarioSelector 
                />
            </div>
            <div className="right">
                <TimelineToolbar />                
            </div>
        </div>
    );
}

export default TimelineHeader;
