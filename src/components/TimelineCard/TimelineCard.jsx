import React, { useEffect, useRef, useState } from 'react';
import TimelineChart from './TimelineChart';
import TimelineHeader from './TimelineHeader/TimelineHeader';
import TimelineFooter from './TimelineFooter';
import Divider from '@mui/material/Divider';
import './TimelineCard.css';

const DEFAULT_CARD_HEIGHT = 500;
const MIN_CARD_HEIGHT = 350;
const MAX_CARD_HEIGHT = 900;

function TimelineCard({ simData, onHover }) {
    
    const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_HEIGHT);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartYRef = useRef(0);
    const dragStartHeightRef = useRef(DEFAULT_CARD_HEIGHT);
    const rafIdRef = useRef(null);
    const pendingHeightRef = useRef(DEFAULT_CARD_HEIGHT);

    useEffect(() => {
        const onMouseMove = (event) => {
            if (!isResizing) return;

            // Dragging upward increases height; dragging downward decreases it.
            const deltaY = event.clientY - dragStartYRef.current;
            const nextHeight = dragStartHeightRef.current - deltaY;
            const viewportMax = Math.max(MIN_CARD_HEIGHT, window.innerHeight - 80);
            const clampedHeight = Math.max(MIN_CARD_HEIGHT, Math.min(nextHeight, Math.min(MAX_CARD_HEIGHT, viewportMax)));
            pendingHeightRef.current = clampedHeight;
            if (rafIdRef.current == null) {
                rafIdRef.current = window.requestAnimationFrame(() => {
                    setCardHeight(pendingHeightRef.current);
                    rafIdRef.current = null;
                });
            }
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            setIsResizing(false);
            document.body.style.userSelect = '';
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [isResizing]);

    const onResizeStart = (event) => {
        event.preventDefault();
        dragStartYRef.current = event.clientY;
        dragStartHeightRef.current = cardHeight;
        setIsResizing(true);
        document.body.style.userSelect = 'none';
    };

    return (  
        <div
            className={`empty-container container-timeline ${isResizing ? 'is-resizing' : ''}`}
            style={{ height: `${cardHeight}px` }}
        >
            <button
                type="button"
                className="timeline-resize-handle"
                aria-label="Resize timeline card vertically"
                onMouseDown={onResizeStart}
            />
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
