import React, { useEffect, useState } from 'react';
import Pagination from '@mui/material/Pagination';
import TimelineChart from './TimelineChart';
import TimelineHeader from './TimelineHeader';
import './TimelineCard.css';

function TimelineCard({ simData }) {

    return (  
        <div className="empty-container container-timeline">
            <TimelineHeader simData={simData} />
            {/* <h1>Timeline Card</h1> */}
            <TimelineChart data={simData[Object.keys(simData)[0]]?.TimelineLogbooks?.all?.compiled ?? []} />
        </div>
    );
}

export default TimelineCard;
