import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
import { getFormattedCoordData } from './populate';
import { initializeRoom, getRoomFrHandle, getAxisLimitFrHandle } from './room';
import { isNumber } from '@mui/x-data-grid/internals';
import Slider from '@mui/material/Slider';

const initialDimensions = { x: 18, y: 14 };
const scaleFactor = 40;
const themeColor = colorConfig.primaryBlue;
const STYLE = {
    chartWidth: "100%",
    chartHeight: 600,
    marginLeft: 40,
    marginRight: 40,
    marginTop: 20,
    marginBottom: 50,
    paddingRatio: 0.6,
    icon: {
        personPlan: 'path://M68.71,34.27c.53.19,1.07.38,1.6.58.17.09.35.17.52.26,2.83,2.21,5.99,4.11,8.43,6.69,4.86,5.13,2.92,12.94-3.9,15.97-2.36,1.05-5.12,1.21-7.7,1.76-.34.07-.69.1-1.03.14-1.2.47-2.4.94-3.6,1.42-.93.37-2.22.52-2.66,1.21-.33.53.42,1.74.68,2.65.08.3.12.6.18.9-.41-.83-.72-1.73-1.26-2.48-.27-.37-.94-.65-1.42-.63-.86.04-1.7.33-2.55.51-.03-.92-.06-1.85-.1-2.77.62-.49,1.32-.92,1.85-1.49.44-.47.69-1.11,1.02-1.67.52-.41,1.24-.72,1.53-1.26,3.19-5.78,3.2-11.66.39-17.58-1.23-1.53-2.45-3.05-3.68-4.58,3.19-.03,6.38-.06,9.57-.1.36.06.72.12,1.08.18.2.03.4.06.61.09.14.06.28.12.42.18Z M30.33,59.68c-2.61-.46-5.36-.56-7.8-1.46-5.58-2.07-8.27-6.86-7.18-12.09.68-3.23,3-5.35,5.32-7.41,3.86-3.42,8.24-5.42,13.57-4.91,1.88.18,3.8.06,5.7.08-.04.09-.06.21-.13.27-3.01,2.33-5.03,5.22-5.21,9.15-.1.24-.21.47-.31.71,0,1.9.02,3.81.03,5.71l.29.69c.01.26.02.53.03.79.13.37.25.74.38,1.11.12.55.23,1.1.35,1.65.24.36.48.72.72,1.09l1.94,2.89c.15.08.29.16.44.24,0,0-.02-.02-.02-.02.18.22.35.44.53.66.71.62,1.41,1.24,2.12,1.86-.1.86-.21,1.72-.31,2.59-1.24-.19-2.48-.37-3.72-.56-1.14-.65-2.24-1.39-3.43-1.94-1.05-.48-2.2-.74-3.31-1.1Z M30.33,59.68c1.11.36,2.26.62,3.31,1.1,1.19.54,2.29,1.28,3.43,1.94-1.12,1.9-2.14,3.88-3.46,5.63-.3.39-1.66-.02-2.54-.06-.11-.14-.23-.27-.34-.41-.14-.31-.28-.61-.42-.92-.1-.39-.2-.77-.3-1.16,0-.92,0-1.84,0-2.76.1-.88.19-1.77.29-2.65.01-.24.03-.48.04-.72Z M61.24,65.87c-.06-.3-.1-.61-.18-.9-.26-.91-1.01-2.12-.68-2.65.44-.69,1.73-.84,2.66-1.21,1.2-.48,2.4-.95,3.6-1.42,0,.25.02.5.02.76.09.74.18,1.48.27,2.22,0,1.11,0,2.22,0,3.33-.22.61-.45,1.22-.67,1.82-.23.26-.45.52-.68.78-.24.1-.47.2-.71.3-.19,0-.39,0-.58-.01-.18-.08-.36-.17-.54-.25-.1-.05-.21-.09-.31-.14-.16-.11-.32-.23-.48-.34-.07-.07-.14-.13-.2-.2-.14-.15-.28-.3-.42-.44,0,0,0,0,0,0-.33-.44-.66-.87-.98-1.31-.04-.11-.08-.22-.12-.33Z M40.78,63.27c.1-.86.21-1.72.31-2.59,2.23.93,4.45,1.88,6.7,2.77.38.15.93.21,1.29.05,2.3-.96,4.56-2,6.84-3.01.03.92.06,1.85.1,2.77-1.75.27-3.5.76-5.24.75-3.17-.02-6.34-.35-9.52-.56-.16-.01-.32-.12-.47-.19Z M30.29,60.4c-.1.88-.19,1.77-.29,2.65.1-.88.19-1.77.29-2.65Z M66.93,62.65c-.09-.74-.18-1.48-.27-2.22.09.74.18,1.48.27,2.22Z M66.27,67.81c.22-.61.45-1.22.67-1.82-.22.61-.45,1.22-.67,1.82Z M61.36,66.2c.33.44.66.87.98,1.31-.33-.44-.66-.87-.98-1.31Z M30,65.8c.1.39.2.77.3,1.16-.1-.39-.2-.77-.3-1.16Z M67.68,34.01c-.36-.06-.72-.12-1.08-.18.36.06.72.12,1.08.18Z M64.88,68.89c.24-.1.47-.2.71-.3-.24.1-.47.2-.71.3Z M63.75,68.63c.18.08.36.17.54.25-.18-.08-.36-.17-.54-.25Z M62.96,68.15c.16.11.32.23.48.34-.16-.11-.32-.23-.48-.34Z M30.73,67.88c.11.14.23.27.34.41-.11-.14-.23-.27-.34-.41Z M62.34,67.51c.14.15.28.3.42.44-.14-.15-.28-.3-.42-.44Z M70.84,35.11c-.17-.09-.35-.17-.52-.26.17.09.35.17.52.26Z M68.71,34.27c-.14-.06-.28-.12-.42-.18.14.06.28.12.42.18Z M60.71,38.5c-1.23-1.53-2.45-3.05-3.68-4.58-5.69-3.74-11.39-3.8-17.09-.04-.04.09-.06.21-.13.27-3.01,2.33-5.03,5.22-5.21,9.15-.1.24-.21.47-.31.71,0,1.9.02,3.81.03,5.71.1.23.2.46.29.69.01.26.02.53.03.79.14.07.28.14.42.21-.01.3-.02.6-.04.9.12.55.23,1.1.35,1.66.24.36.48.72.72,1.09.65.96,1.29,1.93,1.94,2.89.15.08.29.16.44.24,0,0-.02-.02-.02-.02.5.26,1,.52,1.5.78.37.1.74.21,1.11.31.08.02.16.04.25.06,4.87.41,9.32-.81,13.52-3.25.44-.26,1.3.03,1.9.24.72.25,1.38.68,2.07,1.04.52-.41,1.24-.72,1.53-1.26,3.19-5.78,3.2-11.66.39-17.58Z M41.3,59.33c4.87.41,9.32-.81,13.52-3.25.44-.26,1.3.03,1.9.24.72.25,1.38.68,2.07,1.04-.33.56-.58,1.21-1.02,1.67-.54.57-1.23,1-1.85,1.49-2.28,1.01-4.54,2.04-6.84,3.01-.36.15-.91.1-1.29-.05-2.25-.89-4.47-1.84-6.7-2.77-.71-.62-1.41-1.24-2.12-1.86.33.04.65.08.98.13.37.1.74.21,1.11.31.08.02.16.04.25.06Z M39.95,58.96c-.32-.04-.65-.08-.98-.13-.18-.22-.35-.44-.53-.66.5.26,1,.52,1.5.78Z M35.36,53.97c.24.36.48.72.72,1.09-.24-.36-.48-.72-.72-1.09Z M35.05,51.42c-.01.3-.02.6-.04.9-.13-.37-.25-.74-.38-1.11.14.07.28.14.42.21Z M34.31,49.72c.1.23.2.46.29.69-.1-.23-.2-.46-.29-.69Z M34.6,43.3c-.1.24-.21.47-.31.71.1-.24.21-.47.31-.71Z M38.02,57.95c.15.08.29.16.44.24-.15-.08-.29-.16-.44-.24Z M41.3,59.33c-.08-.02-.17-.04-.25-.06.08.02.16.04.25.06Z',
        handleIcon: 'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z',
    }
};
const LOADINGSTATE = {};

export default function LobbyChart({ worstQueue, _style = {} }) {

    // LOADING STATE CHECK
    const isLoading = !isNumber(worstQueue);
    
    // ----------------------------------------------------------------------------
    // INITIALIZE STATE
    const [queue, setQueue] = useState(worstQueue);
    // in real usage, queue should be a prop passed from above, 
    // and should update whenever the queue changes. For testing purposes, 
    // we can use a state variable and manually change it to see the effect.

    // ----------------------------------------------------------------------------
    // ----------------------------------------------------------------------------
    // INITIALIZE ROOM
    // Trigged [ONMOUNT]
    const initialRoom = useMemo(() => {
        const { x, y } = initialDimensions;
        return initializeRoom(x, y);
    }, []);
    const roomRef = useRef(initialRoom);
    
    // ----------------------------------------------------------------------------
    // INITIALIZE CHART
    // Triggerd by [PROP] style
    const chartRef = useRef(null);
    const [chartReady, setChartReady] = useState(false);
    const style = { ...STYLE, ..._style };
    const baseChartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        const xyAxis = {
            type: 'value',
            interval: 1.0,
            minInterval: 1.0,
            maxInterval: 1.0,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            axisPointer: {
                label: { show: true, margin: 30 }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: colorConfig.tertiaryGrey,
                    width: 1,
                    type: 'solid',
                }
            }
        };
        const grid = {
            left: style.marginLeft,
            right: style.marginRight,
            top: style.marginTop,
            bottom: style.marginBottom,
        };
        const tooltip = {
            show: true,
            triggerOn: 'none',
        };
        const dataZoom = [
            {
                type: 'inside',
                xAxisIndex: [0],
                filterMode: 'none',
                throttle: 10,
                // startValue: drawingSize * -0.5 - 2,
                // endValue: drawingSize * 0.5 + 2,
                preventDefaultMouseMove: true,
            },
            {
                type: 'inside',
                yAxisIndex: [0],
                filterMode: 'none',
                throttle: 10,
                // startValue: drawingSize * -0.5 - 2,
                // endValue: drawingSize * 0.5 + 2,
                preventDefaultMouseMove: true,
            }
        ]
        return {
            grid: grid,
            xAxis: xyAxis,
            yAxis: xyAxis,
            tooltip: tooltip,
            dataZoom: dataZoom,
        }
    }, [isLoading, style]);

    // ----------------------------------------------------------------------------
    // ----------------------------------------------------------------------------
    // USER INTERACTION EVENT FUNCTIONS
    // Triggerd by [REF] RoomRef.handle -> User Drag Event
    const handleRoomUpdates = useCallback((dataIndex, pos) => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;
        // Fetch User Updated Coordinate
        const nextPoint = chart.convertFromPixel('grid', pos);
        if (!Array.isArray(nextPoint) || nextPoint.length < 2) return;
        // Update Handle
        roomRef.current.handles[dataIndex] = nextPoint;
        // Update Room
        roomRef.current = getRoomFrHandle(roomRef.current.handles);
        // Update Chart
        chart.setOption({
            series: [{
                id: 'roomHandles',
                data: roomRef.current.handles,
            }, {
                id: 'room',
                data: roomRef.current.lines,
            }]
        });
    }, []);

    // ----------------------------------------------------------------------------
    // POPULATION UPDATE TIMER
    // Creates Version Trigger to execute POPULATION UPDATE LOGIC at set interval
    // during user dragging events.
    const [locVersion, setLocVersion] = useState(0);
    const recomputeTimerRef = useRef(null);
    // Trigger Memo Recompute
    const scheduleLocUpdate = useCallback(() => {
        if (recomputeTimerRef.current) return;
        // ^THROTTLE GATE^
        // latestRoomRef.current = roomRef.current;
        recomputeTimerRef.current = setTimeout(() => {
            recomputeTimerRef.current = null;
            setLocVersion(v => v + 1); 
            // only this triggers heavy recompute
        }, 100); // tune interval
    }, []);

    // Trigger Final Update on Drag End
    const flushLocUpdate = useCallback(() => {
        if (recomputeTimerRef.current) {
            clearTimeout(recomputeTimerRef.current);
            recomputeTimerRef.current = null;
        }
        setLocVersion(v => v + 1); // final exact update
    }, []);

    useEffect(() => {
        return () => {
            if (recomputeTimerRef.current) {
                clearTimeout(recomputeTimerRef.current);
                recomputeTimerRef.current = null;
            }
        };
    }, []);

    // ----------------------------------------------------------------------------
    // POPULATION UPDATE LOGIC
    // Triggerd by [PROPS] worstQueue, [REF/THROTTLE] RoomRef, locVersion
    const locs = useMemo(() => {
        return getFormattedCoordData(
            worstQueue, 
            roomRef.current, 
            roomRef.current.lines[0]
        ); // Returns echarts-ready data [{ value: [x, y], symbolRotate: r }, ...]
    }, [worstQueue, locVersion]);
    // SLICE POPULATION
    // Triggered by [PROPS] queue
    const locSliced = locs.slice(0, Math.min(queue, locs.length));

    // ----------------------------------------------------------------------------
    // AXIS RANGE UPDATE LOGIC
    const handleAxisUpdate = useCallback(() => {
        const axis = getAxisLimitFrHandle(roomRef.current.handles);
        chartRef.current?.getEchartsInstance?.().setOption({
            xAxis: axis.xAxis,
            yAxis: axis.yAxis,
        });
    }, []);

    // ----------------------------------------------------------------------------
    // ALL ACTIONS ON USER DRAG
    const onPtDragMaster = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        const graphic = roomRef.current.handles.map((item, dataIndex) => ({
            id: `drag-point-${dataIndex}`,
            type: 'circle',
            position: chart.convertToPixel('grid', item),
            shape: { cx: 0, cy: 0, r: 20 / 2, },
            invisible: true,
            draggable: true,
            ondrag: function () {
                handleRoomUpdates(dataIndex, [this.x, this.y]);
                handleAxisUpdate();
                scheduleLocUpdate();
            },
            ondragend: function () {
                flushLocUpdate();
                handleAxisUpdate();
            },
            z: 100,
        }));

        chart.setOption({ graphic });

    }, [handleRoomUpdates, scheduleLocUpdate, flushLocUpdate, handleAxisUpdate])
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
        // Makes sure pixel cooridnates are updated upon zooming
        window.addEventListener('resize', handleUpdate);
        // Makes sure pixel cooridnates are updated upon resizing the window

        return () => {
            // Below code is run only just before this useEffect is triggered again
            // timerId is the handle; So “handle” = “the reference you keep so you can manage/undo that thing later.”
            clearTimeout(timerId);
            chart.off('dataZoom', handleUpdate);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [chartReady, onPtDragMaster]);

    // ----------------------------------------------------------------------------
    // CREATE SERIES
    // Triggered by [PROPS + REF/THROTTLE] locSliced, [REF]roomRef
    const areaPerHead = roomRef.current.x * roomRef.current.y / queue;
    const diaPerHead = [0.6, 0.45].map(d => d * Math.min(2, (areaPerHead / Math.PI) / (0.6 * 0.45)));
    const chartSeries = useMemo(() => {
        if (isLoading) return [];

        const master = {
            animation: false,
            animationDurationUpdate: 100,
        }
        const seriesPersons = {
            ...master,
            name: `Passenger x ${queue}`,
            type: 'scatter',
            data: locSliced,
            symbol: style.icon.personPlan,
            symbolSize: [0.54 * scaleFactor, 0.3 * scaleFactor],
            itemStyle: {
                color: themeColor,
                borderColor: 'White',
                borderWidth: 1,
            },
        }
        const seriesBody = {
            ...master,
            name: 'Body Area',
            type: 'scatter',
            data: locSliced,
            symbol: 'circle',
            symbolSize: [0.6 * scaleFactor, 0.45 * scaleFactor],
            itemStyle: {
                color: 'transparent',
                borderColor: themeColor,
                borderWidth: 1.0,
                borderType: 'dashed',
            },
        }
        
        const seriesOccupied = {
            ...master,
            name: 'Occupied Area',
            type: 'scatter',
            data: locSliced,
            symbol: 'circle',
            symbolSize: diaPerHead.map(d => d * scaleFactor),
            itemStyle: {
                color: themeColor,
                opacity: 0.1,
                borderWidth: 0.0,
            },
            silent: true,
            tooltip: { show: false },
        }
        const popSeries = [seriesPersons, seriesBody, seriesOccupied];

        const seriesRoom = {
            id: 'room',
            name: 'Lobby',
            type: 'line',
            animation: false,
            symbol: 'none',
            lineStyle: {
                color: themeColor,
                opacity: 0.2,
                width: 4.0,
                type: [10, 8],
                cap: 'square',
            },
            data: roomRef.current.lines,
            tooltip: { show: false },
        }
        const seriesHandles = {
            id: 'roomHandles',
            type: 'scatter',
            animation: false,
            symbol: style.icon.handleIcon,
            symbolSize: 10,
            itemStyle: {
                color: 'white',
                opacity: 1.0,
                borderColor: themeColor,
                borderWidth: 2.0,
            },
            data: roomRef.current.handles,
            z: 10,
        }
        const roomSeries = [seriesRoom, seriesHandles];
        return [...popSeries, ...roomSeries];

    }, [locSliced, style]);

    // ----------------------------------------------------------------------------
    // UPDATE AXIS
    // Triggered by [REF/THROTTLE] RoomRef, locVersion
    const axisLimits = useMemo(() => getAxisLimitFrHandle(roomRef.current.handles), [locVersion]);
    // ----------------------------------------------------------------------------
    // ADD SERIES TO CHART
    // Triggered by [PROPS + REF/THROTTLE] locSliced, axisLimits, [REF]roomRef
    const chartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        const legend = {
            top: style.marginTop * 0.25,
            right: style.marginRight,
            itemWidth: scaleFactor * 0.25,
            itemHeight: scaleFactor * 0.25,
            data: chartSeries.map(series => {
                return { name: series.name, icon: series.symbol };
            }),
        };
        return {
            ...baseChartOption,
            series: chartSeries,
            legend: legend,
            xAxis: {...baseChartOption.xAxis, ...axisLimits.xAxis},
            yAxis: {...baseChartOption.yAxis, ...axisLimits.yAxis},
        }
    }, [isLoading, baseChartOption, chartSeries, style, axisLimits]);

    
    if (!chartOption) {
        return <div>Loading chart...</div>;
    }
    return (
        <div style={{ width: '100%', height: style.chartHeight }}>
            <Slider defaultValue={50} aria-label="Default" valueLabelDisplay="auto" onChange={(event, value) => { setQueue(value) }} />
            <ReactECharts
                ref={chartRef}
                option={chartOption}
                style={{ height: '100%', width: '100%' }}
                showLoading={isLoading}
                onChartReady={() => setChartReady(true)}
            />
        </div>
    );
}
