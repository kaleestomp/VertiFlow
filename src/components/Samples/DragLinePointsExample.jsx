import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { data } from 'react-router-dom';

const symbolSize = 20;
const initialData = [
    [40, -10],
    [-30, -5],
    [-76.5, 20],
    [-63.5, 40],
    [-22.1, 50],
];
const staticData = {
    title: {
        text: 'Try Dragging these Points',
        left: 'center',
    },
    tooltip: {
        triggerOn: 'none',
        formatter: function (params) {
            return `X: ${params.data[0].toFixed(2)}<br>Y: ${params.data[1].toFixed(2)}`;
        },
    },
    grid: {
        top: '8%',
        bottom: '12%',
    },
    xAxis: {
        min: -100,
        max: 70,
        type: 'value',
        axisLine: { onZero: false },
    },
    yAxis: {
        min: -30,
        max: 60,
        type: 'value',
        axisLine: { onZero: false },
    },
    dataZoom: [
        {
            type: 'slider',
            xAxisIndex: 0,
            filterMode: 'none',
        },
        {
            type: 'slider',
            yAxisIndex: 0,
            filterMode: 'none',
        },
        {
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'none',
        },
        {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'none',
        },
    ],
}

export default function DragLinePointsExample() {
    const chartRef = useRef(null);
    const dataRef = useRef(initialData.map((item) => [...item]));
    const [chartReady, setChartReady] = useState(false);

    const option = useMemo(() => ({
        ...staticData,
        series: [
            {
                id: 'a',
                type: 'line',
                smooth: true,
                symbolSize: symbolSize,
                data: dataRef.current,
            },
        ],
    }), []);

    // Show tooltip when on mouse hover
    const showTooltip = useCallback((dataIndex) => {
        const chart = chartRef.current?.getEchartsInstance?.();
        // console.log('Chart', chart);
        if (!chart) return;

        chart.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            dataIndex,
        });
    }, []);

    // Hide tooltip when mouse leaves the point
    const hideTooltip = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        chart.dispatchAction({
            type: 'hideTip',
        });
    }, []);

    const onPointDragging = useCallback((dataIndex, pos) => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const nextPoint = chart.convertFromPixel('grid', pos);
        console.log('Next Point', nextPoint);
        if (!Array.isArray(nextPoint) || nextPoint.length < 2) return;
        // console.log('Next Point', nextPoint);
        // Update the position of the dragged point in the data array
        dataRef.current[dataIndex] = nextPoint;
        // Update the chart with the new data to trigger re-rendering
        chart.setOption({
            series: [
                {
                    id: 'a',
                    data: dataRef.current,
                },
            ],
        });
    }, []);

    // setChartOption is here to trigger re-rendering
    const updatePosition = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const graphic = dataRef.current.map((item, dataIndex) => {
            // console.log('Item', item);
            return {
                id: `drag-point-${dataIndex}`,
                type: 'circle',
                position: chart.convertToPixel('grid', item),
                shape: {
                    cx: 0,
                    cy: 0,
                    r: symbolSize / 2,
                },
                invisible: true,
                draggable: true,
                ondrag: function () {
                    onPointDragging(dataIndex, [this.x, this.y]);
                },
                onmousemove: function () {
                    showTooltip(dataIndex);
                },
                onmouseout: function () {
                    hideTooltip();
                },
                z: 100,
            }
        });

        chart.setOption({ graphic });
    }, [hideTooltip, onPointDragging, showTooltip]);
    //Above are dependencies for memorization correctiness only not for trigger
    // Practical rule:
    // Include every external value used inside the callback/effect.
    // Only skip if you intentionally want a fixed one-time snapshot (rare and usually documented).

    useEffect(() => {
        if (!chartReady) return;

        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const handleUpdate = () => {
            updatePosition();
        };

        const timerId = setTimeout(() => {
            updatePosition();
        }, 0);
        // This code schedules updatePosition() to run asynchronously on the next event-loop turn, 
        // instead of running immediately in the current call stack. A delay of 0 does not mean “right now”; 
        // it means “as soon as the browser can run it after current work finishes.”
        // timerId is the handel
        // So “handle” = “the reference you keep so you can manage/undo that thing later.”

        chart.on('dataZoom', handleUpdate);
        // Makes sure pixel cooridnates are updated upon zooming
        window.addEventListener('resize', handleUpdate);
        // Makes sure pixel cooridnates are updated upon resizing the window

        return () => {
            // Below code is run only just before this useEffect is triggered again
            clearTimeout(timerId);
            chart.off('dataZoom', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [chartReady, updatePosition]); 
    // updatePosition may be for memorization correctness only, not for trigger

    return (
        <div style={{ width: '100%', height: 500 }}>
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ width: '100%', height: '100%' }}
                onChartReady={() => setChartReady(true)}
            />
        </div>
    );
}
