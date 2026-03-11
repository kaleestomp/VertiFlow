import { useState, useMemo, useRef, useEffect } from 'react';
import { getFormattedCoordData } from './utils/populate';

export function usePopulation({ isLoading, roomRef, roomVersions, maxQueue, queue }) {
    // ----------------------------------------------------------------------------
    // POPULATION UPDATE LOGIC
    // Triggerd by [PROPS] worstQueue, [REF/THROTTLE] RoomRef, locVersion
    const locCacheRef = useRef({});
    const prevRoomVersionsRef = useRef({});
    const [locCacheTick, setLocCacheTick] = useState(0);
    // Recompute only dirty rooms
    useEffect(() => {
        if (isLoading) return;

        const nextCache = { ...locCacheRef.current };
        const nextPrevVersions = { ...prevRoomVersionsRef.current };
        let changed = false;
        const maxQueueObj = maxQueue ?? {};

        for (const [roomID, maxQ] of Object.entries(maxQueueObj)) {
            const nextVersion = roomVersions[roomID] ?? 0;
            const prevVersion = nextPrevVersions[roomID];
            const missingCache = !nextCache[roomID];

            if (missingCache || prevVersion !== nextVersion) {
                nextCache[roomID] = getFormattedCoordData(
                    maxQ,
                    roomRef.current[roomID],
                    roomRef.current[roomID].center
                );
                nextPrevVersions[roomID] = nextVersion;
                changed = true;
            }
        }

        // Clean up removed rooms
        for (const roomID of Object.keys(nextCache)) {
            if (!(roomID in maxQueueObj)) {
                delete nextCache[roomID];
                delete nextPrevVersions[roomID];
                changed = true;
            }
        }

        if (changed) {
            locCacheRef.current = nextCache;
            prevRoomVersionsRef.current = nextPrevVersions;
            setLocCacheTick((t) => t + 1);
        }
    }, [isLoading, maxQueue, roomVersions]);

    const locRegister = useMemo(() => locCacheRef.current, [locCacheTick]);
    // SLICE POPULATION
    // Triggered by [PROPS] queue
    const locSliced = Object.entries(locRegister ?? {}).reduce((acc, [roomID, locList]) => ({
        ...acc,
        [roomID]: locList.slice(0, Math.min(queue[roomID] ?? 0, locList.length))
    }), {});

    return locSliced;
}