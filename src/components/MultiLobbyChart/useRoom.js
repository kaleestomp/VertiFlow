import { useMemo, useRef, useEffect } from 'react';
import { initializeRoom } from './utils/room';

const defaultDimensions = { x: 8, y: 4 };

export function useRoom({ maxQueue, roomSpacing }) {

    // ----------------------------------------------------------------------------
    // INITIALIZE ROOM
    // Trigged [ONMOUNT]
    const roomIDs = useMemo(() => maxQueue ? Object.keys(maxQueue) : [], [maxQueue]);
    // If useMemo has no DEPS, it will trigger every render!
    const initialDimensions = useMemo(() => (
        roomIDs.reduce((acc, id) => {
            const { x, y } = defaultDimensions;
            return {
                ...acc,
                [id]: { x, y },
            };
        }, {})
    ), [roomIDs]);
    
    const startCenter = useMemo(() => {
        const initialTotalX = Object.values(initialDimensions ?? {}).reduce(
            (sum, dims) => sum + (dims?.x ?? 0), 0
        ) + roomSpacing * (Object.keys(initialDimensions ?? {}).length - 1);
        
        return [initialTotalX * -0.5 + initialDimensions[roomIDs[0]].x * 0.5, 0];
    }, [roomIDs, initialDimensions, roomSpacing]);
    
    const initialRooms = useMemo(() => {
        const rooms = {};
        let acc = 0;
        roomIDs.forEach((id, index) => {
            const { x, y } = initialDimensions[id];
            // const roomSpacing = Math.round(x*0.45);
            const center = (index === 0)
                ? startCenter
                : [startCenter[0] + acc + rooms[roomIDs[index - 1]].x * 0.5 + roomSpacing + x * 0.5, 0];
            if (index !== 0) { acc += rooms[roomIDs[index - 1]].x * 0.5 + roomSpacing + x * 0.5 }
            rooms[id] = initializeRoom(x, y, center);
        });
        return rooms;
    }, [roomIDs, initialDimensions, startCenter, roomSpacing]);

    const roomRef = useRef(initialRooms);
    useEffect(() => {
        roomRef.current = initialRooms;
    }, [initialRooms]);

    return { roomRef, initialRooms };
}