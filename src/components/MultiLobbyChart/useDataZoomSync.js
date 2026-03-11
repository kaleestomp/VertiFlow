import { useRef, useEffect } from 'react';

const BOTTOM_OFFSET = 500 * 0.5;
const LEFT_OFFSET = 200 * 0.5;

export function useDataZoomSync({ chartRef, chartReady, roomRef, roomIDs, activeViewUNIT, activeViewPX }) {
    // ACTIONS ON USER WINDOW RESIZE (OR ZOOM)
    // Note: UnitPX only updates on window resize; for Zooming Updates logics are owned by useUnitPXSync
    const dataZoomChangeActive = useRef(false);
    const lastAppliedViewRef = useRef(null);
    const lastAppliedViewPXRef = useRef(null);

    useEffect(() => {
        if (!chartReady) return;
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        // Snap Current Zoom Extent
        const currentView = activeViewUNIT;
        const currentCenter = Object.values(roomRef.current).map((room) => room.center)
            .reduce((acc, center) => ([acc[0] + center[0], acc[1] + center[1]]), [0, 0])
            .map(c => (roomIDs.length > 0) ? c / roomIDs.length : 0);
        const prevView = lastAppliedViewRef.current;
        const viewChanged = !prevView || prevView.x !== currentView.x || prevView.y !== currentView.y;
        const windowChanged = !lastAppliedViewPXRef.current ||
            lastAppliedViewPXRef.current.x !== activeViewPX.x ||
            lastAppliedViewPXRef.current.y !== activeViewPX.y;

        // Preserve existing anti-reset guard, except when container resize changes activeViewUNIT.
        if (dataZoomChangeActive.current && !viewChanged) return;
        if (!windowChanged) return;

        const unitPX = activeViewPX.x / activeViewUNIT.x; 
        // unitPX from useUnitPXSync does not work here on initialization
        // for some reason, likely due to mismatching initial derived value from useUnitPXSync;

        chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 0,
            startValue: currentView.x * -0.5 + currentCenter[0] - (LEFT_OFFSET / unitPX),
            endValue: currentView.x * 0.5 + currentCenter[0] - (LEFT_OFFSET / unitPX),
        });
        chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 1,
            startValue: currentView.y * -0.5 + currentCenter[1] - (BOTTOM_OFFSET / unitPX),
            endValue: currentView.y * 0.5 + currentCenter[1] - (BOTTOM_OFFSET / unitPX),
        });
        dataZoomChangeActive.current = true;
        lastAppliedViewRef.current = currentView;
        lastAppliedViewPXRef.current = activeViewPX;

    }, [chartReady, activeViewUNIT.x, activeViewUNIT.y]);

    return { dataZoomChangeActive, lastAppliedViewRef }
}