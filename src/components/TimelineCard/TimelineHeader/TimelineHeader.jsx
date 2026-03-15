import React, { useEffect, useState } from 'react';
import Pagination from '@mui/material/Pagination';
import TimelineToolbar from './TimelineToolbar';
import TimelineTitle from './TimelineTitle';
import ScenarioSelector from './ScenarioSelector';
import './TimelineHeader.css';

function TimelineHeader({ simData }) {

    return (
        <div className="timeline-header-container">
            <div className="timeline-header-left">
                <TimelineTitle />
            </div>
            <div className="timeline-header-center">
                <ScenarioSelector 
                />
            </div>
            <div className="timeline-header-right">
                <TimelineToolbar />                
            </div>
        </div>
    );
}

export default TimelineHeader;
