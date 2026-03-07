import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
import { getFormattedCoordData } from './populate';
import { initializeRoom, getRoomFrHandle } from './room';
import { useElementSize } from '../../utils/observer';
import { getUnitPX, getScaleInfo } from './scale';
import { icons as lobbyIcons } from './icons';

const initialDimensions = { x: 8, y: 4 };
const themeColor = colorConfig.primaryBlue;
const STYLE = {
    chartWidth: "100%",
    chartHeight: "100%",
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    initialZoomViewMinMargin: 2.5,
    paddingRatio: 0.6,
    icon: lobbyIcons,
};
const LOADINGSTATE = {};

export default function LobbyChart({ queue, maxQueue, _style = {} }) {
    
    const maxQ = maxQueue[5];
    const Q = queue[5];
    const keys = queue ? Object.keys(queue) : [];
    // LOADING STATE CHECK
    const isLoading = !Number.isFinite(maxQ);
    
    // ----------------------------------------------------------------------------
    // INITIALIZE ROOM
    // Trigged [ONMOUNT]
    const initialRoom = useMemo(() => {
        const { x, y } = initialDimensions;
        const rooms = initializeRoom(x, y);
        return initializeRoom(x, y);
    }, []);
    const roomRef = useRef(initialRoom);

    // ----------------------------------------------------------------------------
    // PARENT CONTAINER ACTIVE WINDOW
    // Triggerd by Window Resize
    const { containerRef, size } = useElementSize();
    // ----------------------------------------------------------------------------
    // ACCEPT PROPS + ACTIVE WINDOW -> DERIVE SCALE INFO
    const style = { ...STYLE, ..._style, ...getScaleInfo(STYLE, size, initialRoom) };

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART REF & STATE
    const chartRef = useRef(null);
    const [chartReady, setChartReady] = useState(false);
    const dataZoomChangeActive = useRef(false);
    const lastAppliedViewRef = useRef(null);

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART
    // Triggerd by [PROP] style
    const baseChartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        const xyAxis = {
            type: 'value',
            animation: false,
            min: Math.max(initialRoom.x, initialRoom.y) * -10,
            max: Math.max(initialRoom.x, initialRoom.y) * 10,
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
                preventDefaultMouseMove: true,
            },
            {
                type: 'inside',
                yAxisIndex: [0],
                filterMode: 'none',
                throttle: 10,
                preventDefaultMouseMove: true,
            },
        ];
        const series = [{
            type: 'line',
            animation: false,
            data: [[-0.2,0], [0.2,0], [0,0], [0,0.2], [0,-0.2]],
            symbol: 'none',
            lineStyle: {width: 1, color: colorConfig.secondaryGrey, cap: 'round'},
            z: -10,
        }]
        return {
            grid: grid,
            xAxis: xyAxis,
            yAxis: xyAxis,
            tooltip: tooltip,
            dataZoom: dataZoom,
            series: series,
        }
    }, [isLoading]);

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
        // console.log('Recomputing Population...');
        return getFormattedCoordData(
            maxQ,
            roomRef.current,
            roomRef.current.lines[0]
        ); // Returns echarts-ready data [{ value: [x, y], symbolRotate: r }, ...]
    }, [maxQ, locVersion]);
    // SLICE POPULATION
    // Triggered by [PROPS] queue
    const locSliced = locs.slice(0, Math.min(Q, locs.length));

    // ----------------------------------------------------------------------------
    // ACTIONS ON USER DRAG
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
                scheduleLocUpdate();
            },
            ondragend: function () {
                flushLocUpdate();
            },
            z: 100,
        }));

        chart.setOption({ graphic });

    }, [handleRoomUpdates, scheduleLocUpdate, flushLocUpdate])
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

    // ----------------------------------------------------------------------------
    // ACTIONS ON USER ZOOM / WINDOW RESIZE
    // Triggered by User Zoom or Window Resize at every frame?
    useEffect(() => {
        if (!chartReady) return;
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        // Snap Current Zoom Extent
        const currentView = style.activeViewUNIT;
        const currentCenter = roomRef.current.center;
        const prevView = lastAppliedViewRef.current;
        const viewChanged = !prevView || prevView.x !== currentView.x || prevView.y !== currentView.y;

        // Preserve existing anti-reset guard, except when container resize changes activeViewUNIT.
        if (dataZoomChangeActive.current && !viewChanged) return;

        chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 0,
            startValue: currentView.x * -0.5 + currentCenter[0],
            endValue: currentView.x * 0.5 + currentCenter[0],
        });
        chart.dispatchAction({
            type: 'dataZoom',
            dataZoomIndex: 1,
            startValue: currentView.y * -0.5 + currentCenter[1],
            endValue: currentView.y * 0.5 + currentCenter[1],
        });
        dataZoomChangeActive.current = true;
        lastAppliedViewRef.current = currentView;
    }, [chartReady, style.activeViewUNIT.x, style.activeViewUNIT.y]);

    // ----------------------------------------------------------------------------
    // HANDLE UNIT SCALING ON ZOOM
    // Triggered by User Zoom (>0.001)
    const [unitPX, setUnitPX] = useState(style.unitPX);
    // UPDATE SCALE
    // console.log('unitPX:', unitPX, style.unitPX);
    const computeUnitPx = useCallback(() => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return style.unitPX;
        return getUnitPX(chart, style.activeViewPX.x) ?? style.unitPX;
    }, [style.activeViewPX.x, style.unitPX]);

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

    // ----------------------------------------------------------------------------
    // CREATE SERIES
    // Triggered by [PROPS + REF/THROTTLE] locSliced, [REF]roomRef, [STATE]unitPX
    const roomArea = roomRef.current.x * roomRef.current.y;
    const areaPerHead = Q != 0 ? roomArea / Q : roomArea;
    const baseDiameter = Math.min(0.6, Math.sqrt(areaPerHead / Math.PI)) * 2;
    let dia = [baseDiameter, baseDiameter];
    const r2 = Math.pow(baseDiameter * 0.5, 2);
    if (dia[0] < 0.6 && areaPerHead > 0.2121) {
        dia = [0.6, ((areaPerHead / Math.PI) / 0.3) * 2];
    } else if (areaPerHead <= 0.2121) {
        dia = [r2 * (0.3 / (0.3 * 0.225)) * 2, r2 * (0.225 / (0.3 * 0.225)) * 2];
    }
    const chartSeries = useMemo(() => {
        if (isLoading) return [];
        const master = {
            animation: false,
            animationDurationUpdate: 100,
        }
        const seriesPersons = {
            ...master,
            name: `Passenger x ${Q}`,
            type: 'scatter',
            data: locSliced,
            symbol: style.icon.personPlan,
            symbolSize: [0.54 * unitPX, 0.3 * unitPX],
            itemStyle: {
                color: themeColor,
                borderColor: 'White',
                borderWidth: 1,
            },
        }
        const seriesBodyEllipse = {
            ...master,
            name: 'Body Area',
            type: 'scatter',
            data: [],
            symbol: 'circle',
            symbolSize: [0.6 * unitPX, 0.45 * unitPX],
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
            symbolSize: dia.map(d => d * unitPX),
            itemStyle: {
                color: themeColor,
                opacity: 0.1,
                borderWidth: 0.0,
            },
            silent: true,
            tooltip: { show: false },
        }
        const popSeries = [seriesPersons, seriesBodyEllipse, seriesOccupied];
        const seriesRoom = {
            id: 'room',
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

    }, [locSliced, unitPX]);

    const chartLegend = useMemo(() => {
        if (isLoading)  return [];
        const factor = 1.4;
        const areaLabel = areaPerHead < 9 ? areaPerHead.toFixed(1) : '>9';
        return [{
            bottom: 20 * factor,
            left: 26 * factor,
            itemWidth: 55 * factor,
            itemHeight: 55 * factor,
            itemStyle: { borderWidth: 0.5 },
            textStyle: {
                color: themeColor,
                height: 10 * factor,
                fontSize: 14 * factor,
                font: 'open-sans-light',
                padding: [0, 0, 0, 4 * factor],
                rich: {
                    prefix: {
                        fontSize: 14 * factor,
                        lineHeight: 16 * factor,
                        align: 'left',
                    },
                    value: {
                        fontWeight: 'bold',
                        fontSize: 14 * factor,
                        lineHeight: 16 * factor,
                        align: 'left',
                    },
                    unit: {
                        fontSize: 11 * factor,
                        lineHeight: 14 * factor,
                        align: 'center',
                    },
                },
            },
            formatter: () => `{prefix|×}{value|${Q}}\n{unit|passenger}`,
            data: [{ name: `Passenger x ${Q}`, icon: style.icon.personPlan }],
        }, {
            bottom: 20 * factor,
            left: 20 * factor,
            itemWidth: 65 * factor,
            itemHeight: 50 * factor,
            formatter: ' ',
            itemStyle: { borderWidth: 1.2, borderType: 'dashed' },
            data: [{ name: 'Body Area', icon: style.icon.ellipse }],
            inactiveColor: 'transparent',
            inactiveBorderWidth: 2.0,
        }, {
            bottom: 88 * factor,
            left: 20 * factor,
            itemWidth: 65 * factor,
            itemHeight: 65 * factor,
            textStyle: {
                color: themeColor,
                height: 20 * factor,
                font: 'open-sans-light',
                padding: [0, 0, 0, -51 * factor], // gap from icon
                rich: {
                    value: {
                        fontWeight: 'bold',
                        fontSize: 18 * factor,
                        lineHeight: 16 * factor,
                        align: 'center',
                    },
                    unit: {
                        fontSize: 11 * factor,
                        lineHeight: 14 * factor,
                        align: 'center',
                    },
                },
            },
            formatter: () => `{value|${areaLabel}}\n{unit|m²/p}`,
            data: [{ name: 'Occupied Area', icon: 'circle' }],
        }];
    }, [isLoading, areaPerHead, Q]);
    
    // ----------------------------------------------------------------------------
    // ADD SERIES TO CHART
    // Triggered by [PROPS + REF/THROTTLE] locSliced, [REF]roomRef, [STATE]unitPX
    const chartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        return {
            ...baseChartOption,
            series: [...baseChartOption.series, ...chartSeries],
            legend: chartLegend,
        }
    }, [isLoading, baseChartOption, chartSeries, chartLegend]);

    if (!chartOption) {
        return <div>Loading chart...</div>;
    }
    return (
        <div ref={containerRef} style={{ width: '100%', height: style.chartHeight }}>
            <ReactECharts
                ref={chartRef}
                option={chartOption}
                style={{ height: '100%', width: '100%' }}
                showLoading={isLoading}
                onChartReady={() => {
                    dataZoomChangeActive.current = false;
                    lastAppliedViewRef.current = null;
                    setChartReady(true);
                }}
            />
        </div>
    );
}
