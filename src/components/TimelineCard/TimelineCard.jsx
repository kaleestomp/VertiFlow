import React, { useEffect, useRef, useState } from 'react';
import { useResize } from './useResize';
import TimelineChart from './TimelineChart';
import TimelineHeader from './TimelineHeader/TimelineHeader';
import TimelineFooter from './TimelineFooter';
import Divider from '@mui/material/Divider';
import './TimelineCard.css';

function TimelineCard({ simData, onHover }) {
    
    const { cardHeight, isResizing, onResizeStart } = useResize();

    return (  
        <div className={`container-timeline ${isResizing ? 'is-resizing' : ''}`} style={{ height: `${cardHeight}px` }}>
            <button type="button" className="timeline-resize-handle" aria-label="resize-vertical" onMouseDown={onResizeStart}/>
            
            <TimelineHeader simData={simData} />
            <div className="timeline-chart-region">
                <TimelineChart 
                    data={simData[Object.keys(simData)[0]]?.TimelineLogbooks?.all?.compiled ?? []} 
                    onHover={onHover}
                />
            </div>
            <Divider variant="middle"/>
            <TimelineFooter/>
        </div>
    );
}

export default React.memo(TimelineCard);
// memo isolates TimelineCart from processing when states/props in parent change
