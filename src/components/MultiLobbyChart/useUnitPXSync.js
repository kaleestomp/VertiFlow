import { useState, useCallback, useEffect } from 'react';
import { getUnitPX } from './utils/scale';

export function useUnitPXSync({ chartRef, chartReady, initialUnitPX, activeViewPX }) {
    // HANDLE UNIT SCALING ON ZOOM IN / OUT
    // Triggered by User Zoom (>0.001)
    const [unitPX, setUnitPX] = useState(initialUnitPX);
    // UPDATE SCALE
    // console.log('unitPX:', unitPX, style.unitPX);
    const computeUnitPx = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return initialUnitPX;
        return getUnitPX(chart, activeViewPX.x) ?? initialUnitPX;
    }, [activeViewPX.x, initialUnitPX]);

    useEffect(() => {
        if (!chartReady) return;
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const updateUnitPx = () => {
            const next = computeUnitPx();
            setUnitPX(prev => (Math.abs(prev - next) < 0.001 ? prev : next));
        };

        updateUnitPx(); // initial sync after chart ready
        chart.on('dataZoom', updateUnitPx);
        window.addEventListener('resize', updateUnitPx);

        return () => {
            chart.off('dataZoom', updateUnitPx);
            window.removeEventListener('resize', updateUnitPx);
        };
    }, [chartReady, computeUnitPx]);

    return unitPX;
}