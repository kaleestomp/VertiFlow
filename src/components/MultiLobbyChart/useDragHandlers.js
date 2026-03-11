import { useState, useRef, useCallback, useEffect } from 'react';
import { getRoomFrHandle } from './utils/room';

export function useDragHandlers({ chartRef, chartReady, roomRef, roomIDs }) {
    
    // POPULATION UPDATE TIMER
    // Creates Version Trigger to execute POPULATION UPDATE LOGIC at set interval
    // during user dragging events.
    const recomputeTimerRef = useRef(null);
    const [roomVersions, setRoomVersions] = useState(roomIDs.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}));

    // USER INTERACTION EVENT FUNCTIONS
    // Triggerd by [REF] RoomRef.handle -> User Drag Event
    const handleRoomUpdates = useCallback((dataIndex, pos) => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;
        // Fetch User Updated Coordinate
        const nextPoint = chart.convertFromPixel('grid', pos);
        if (!Array.isArray(nextPoint) || nextPoint.length < 2) return;
        // Update Handle
        const roomIDs = Object.keys(roomRef.current);
        const targetRoomID = roomIDs[Math.floor(dataIndex / 4)];
        if (!targetRoomID || !roomRef.current[targetRoomID]) return;
        roomRef.current[targetRoomID].handles[dataIndex % 4] = nextPoint;
        // Update Room
        roomRef.current[targetRoomID] = getRoomFrHandle(roomRef.current[targetRoomID].handles);
        // Update Chart
        chart.setOption({
            series: [{
                id: `roomHandles-${targetRoomID}`,
                data: roomRef.current[targetRoomID].handles,
            }, {
                id: `room-${targetRoomID}`,
                data: roomRef.current[targetRoomID].lines,
            }]
        });
    }, []);

    // Trigger Memo Recompute by updating RoomVersions at set interval during dragging
    const scheduleLocUpdate = useCallback((roomID) => {
        if (recomputeTimerRef.current) return;
        // ^THROTTLE GATE^
        recomputeTimerRef.current = setTimeout(() => {
            recomputeTimerRef.current = null;
            setRoomVersions(v => ({
                ...v,
                [roomID]: (v[roomID] ?? 0) + 1,
            }));
            // only this triggers heavy recompute
        }, 100); // tune interval
    }, [setRoomVersions]);

    // Trigger Final Update on Drag End
    const flushLocUpdate = useCallback((roomID) => {
        if (recomputeTimerRef.current) {
            clearTimeout(recomputeTimerRef.current);
            recomputeTimerRef.current = null;
        }
        setRoomVersions(v => ({
            ...v,
            [roomID]: (v[roomID] ?? 0) + 1,
        })); // final exact update
    }, [setRoomVersions]);

    // Clean up timer on unmount/render end
    useEffect(() => {
        return () => {
            if (recomputeTimerRef.current) {
                clearTimeout(recomputeTimerRef.current);
                recomputeTimerRef.current = null;
            }
        };
    }, []);

    // Reset RoomVersions when roomIDs change (e.g. rooms added/removed)
    useEffect(() => {
        setRoomVersions((prev) => {
            const next = roomIDs.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
            const same =
                Object.keys(prev).length === Object.keys(next).length &&
                Object.keys(next).every((id) => prev[id] === next[id]);
            return same ? prev : next;
        });
    }, [roomIDs]);

    // ----------------------------------------------------------------------------
    // ACTIONS ON USER DRAG
    const onPtDragMaster = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;
        const allHandles = roomIDs.flatMap(id => roomRef.current[id]?.handles ?? []);
        const graphic = allHandles.map((item, dataIndex) => ({
            id: `drag-point-${dataIndex}`,
            type: 'circle',
            position: chart.convertToPixel('grid', item),
            shape: { cx: 0, cy: 0, r: 50 / 2, },
            invisible: true,
            draggable: true,
            ondrag: function () {
                handleRoomUpdates(dataIndex, [this.x, this.y]);
                scheduleLocUpdate(roomIDs[Math.floor(dataIndex / 4)]);
            },
            ondragend: function () {
                flushLocUpdate(roomIDs[Math.floor(dataIndex / 4)]);
            },
            z: 100,
        }));

        chart.setOption({ graphic });

    }, [handleRoomUpdates, scheduleLocUpdate, flushLocUpdate, roomIDs]);
    // Practical rule: Include every external value used inside the callback/effect.
    // Only skip if you intentionally want a fixed one-time snapshot (rare and usually documented).

    useEffect(() => {
        if (!chartReady) return;

        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const handleUpdate = () => { onPtDragMaster(); };
        const timerId = setTimeout(() => { onPtDragMaster(); }, 0);
        // This code schedules updatePosition() to run asynchronously on the next event-loop turn, 
        // instead of running immediately in the current call stack. A delay of 0 does not mean “right now”; 
        // it means “as soon as the browser can run it after current work finishes.”
        chart.on('dataZoom', handleUpdate);
        // Make sure to update scale upon zooming
        window.addEventListener('resize', handleUpdate);
        // Makes sure pixel coordinates are updated upon resizing the window

        return () => {
            // Below code is run only just before this useEffect is triggered again
            // timerId is the handle; So “handle” = “the reference you keep so you can manage/undo that thing later.”
            clearTimeout(timerId);
            chart.off('dataZoom', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [chartReady, onPtDragMaster]);
    

    return roomVersions; 
}