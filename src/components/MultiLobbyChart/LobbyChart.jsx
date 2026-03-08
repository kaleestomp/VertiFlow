import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
import { getFormattedCoordData } from './populate';
import { initializeRoom, getRoomFrHandle } from './room';
import { useElementSize } from '../../utils/observer';
import { getUnitPX, getScaleInfo } from './scale';
import { icons as lobbyIcons } from './icons';

const defaultDimensions = { x: 8, y: 4 };
const themeColor = colorConfig.primaryBlue;
const STYLE = {
    chartWidth: "100%",
    chartHeight: "100%",
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    marginBottom: 0,
    initialZoomViewMinMargin: 2.5,
    roomSpacing: 2.0,
    paddingRatio: 0.6,
    icon: lobbyIcons,
};
const LOADINGSTATE = {};

export default function LobbyChart({ queue, maxQueue, _style = {} }) {
    console.log(queue, maxQueue);
    // LOADING STATE CHECK
    const isLoading = !(queue && Object.keys(queue).length > 0 && maxQueue && Object.keys(maxQueue).length > 0);
    // ----------------------------------------------------------------------------
    // ACCEPT PROPS + ACTIVE WINDOW -> DERIVE SCALE INFO
    let style = { ...STYLE, ..._style };

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
        ) + style.roomSpacing * (Object.keys(initialDimensions ?? {}).length - 1);
        
        return [initialTotalX * -0.5 + initialDimensions[roomIDs[0]].x * 0.5, 0];
    }, [roomIDs]);
    
    const initialRooms = useMemo(() => {
        const rooms = {};
        let acc = 0;
        roomIDs.forEach((id, index) => {
            const { x, y } = initialDimensions[id];
            // const roomSpacing = Math.round(x*0.45);
            const center = (index === 0)
                ? startCenter
                : [startCenter[0] + acc + rooms[roomIDs[index - 1]].x * 0.5 + style.roomSpacing + x * 0.5, 0];
            if (index !== 0) { acc += rooms[roomIDs[index - 1]].x * 0.5 + style.roomSpacing + x * 0.5 }
            rooms[id] = initializeRoom(x, y, center);
        });
        return rooms;
    }, [roomIDs, initialDimensions]);

    const roomRef = useRef(initialRooms);
    
    useEffect(() => {
        roomRef.current = initialRooms;
    }, [initialRooms]);
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
    // PARENT CONTAINER ACTIVE WINDOW
    // Triggerd by Window Resize
    const { containerRef, size } = useElementSize();
    style = { ...style, ...getScaleInfo(STYLE, size, roomRef.current) }; // initialRooms

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART REF & STATE
    const chartRef = useRef(null);
    const [chartReady, setChartReady] = useState(false);
    const dataZoomChangeActive = useRef(false);
    const lastAppliedViewRef = useRef(null);
    const lastAppliedViewPXRef = useRef(null);

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART
    // Triggerd by [PROP] style
    const baseChartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        // Find Max Dimensions to Set Axis Limits
        const totalX = Object.values(initialRooms ?? {}).reduce(
            (sum, room) => sum + (room?.x ?? 0), 0
        ) + style.roomSpacing * (Object.keys(initialRooms ?? {}).length - 1);
        const totalY = Object.values(initialRooms ?? {}).reduce(
            (height, room) => Math.max(height, (room?.y ?? 0)), 0
        );
        const maxDim = Math.max(totalX, totalY);
        const xyAxis = {
            type: 'value',
            animation: false,
            min: Math.max(1, Math.ceil(maxDim * 10)) * -1,
            max: Math.max(1, Math.ceil(maxDim * 10)) * 1,
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
            data: [[-0.2, 0], [0.2, 0], [0, 0], [0, 0.2], [0, -0.2]],
            symbol: 'none',
            lineStyle: { width: 1, color: colorConfig.secondaryGrey, cap: 'round' },
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
    }, [isLoading, roomIDs]);

    // ----------------------------------------------------------------------------
    // ----------------------------------------------------------------------------
    // USER INTERACTION EVENT FUNCTIONS
    // Triggerd by [REF] RoomRef.handle -> User Drag Event
    // const [targetRoomID, setTargetRoomID] = useState(null);
    const handleRoomUpdates = useCallback((dataIndex, pos) => {
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;
        // Fetch User Updated Coordinate
        const nextPoint = chart.convertFromPixel('grid', pos);
        if (!Array.isArray(nextPoint) || nextPoint.length < 2) return;
        // Update Handle
        // setTargetRoomID(Math.floor(dataIndex / 4));
        const targetRoomID = roomIDs[Math.floor(dataIndex / 4)];
        if (!targetRoomID || !roomRef.current[targetRoomID]) return;

        roomRef.current[targetRoomID].handles[dataIndex % 4] = nextPoint;
        // Update Room
        roomRef.current[targetRoomID] = getRoomFrHandle(roomRef.current[targetRoomID].handles);
        // Update Chart
        // style = { ...style, ...getScaleInfo(STYLE, size, roomRef) };
        chart.setOption({
            series: [{
                id: `roomHandles-${targetRoomID}`,
                data: roomRef.current[targetRoomID].handles,
            }, {
                id: `room-${targetRoomID}`,
                data: roomRef.current[targetRoomID].lines,
            }]
        });
    }, [roomIDs]);

    // ----------------------------------------------------------------------------
    // POPULATION UPDATE TIMER
    // Creates Version Trigger to execute POPULATION UPDATE LOGIC at set interval
    // during user dragging events.
    const [roomVersions, setRoomVersions] = useState(roomIDs.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}));
    const recomputeTimerRef = useRef(null);
    // Trigger Memo Recompute
    const scheduleLocUpdate = useCallback((roomID) => {
        if (recomputeTimerRef.current) return;
        // ^THROTTLE GATE^
        // latestRoomRef.current = roomRef.current;
        recomputeTimerRef.current = setTimeout(() => {
            recomputeTimerRef.current = null;
            setRoomVersions(v => ({
                ...v,
                [roomID]: (v[roomID] ?? 0) + 1,
            }));
            // only this triggers heavy recompute
        }, 100); // tune interval
    }, []);

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
            shape: { cx: 0, cy: 0, r: 20 / 2, },
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

    // ----------------------------------------------------------------------------
    // ACTIONS ON USER ZOOM / WINDOW RESIZE
    // Triggered by User Zoom or Window Resize at every frame?
    useEffect(() => {
        if (!chartReady) return;
        const chart = chartRef.current?.getEchartsInstance?.();
        if (!chart) return;

        // Snap Current Zoom Extent
        const currentView = style.activeViewUNIT;
        const currentCenter = Object.values(roomRef.current).map((room) => room.center)
            .reduce((acc, center) => ([acc[0] + center[0], acc[1] + center[1]]), [0, 0])
            .map(c => (roomIDs.length > 0) ? c / roomIDs.length : 0);
        const prevView = lastAppliedViewRef.current;
        const viewChanged = !prevView || prevView.x !== currentView.x || prevView.y !== currentView.y;
        const windowChanged = !lastAppliedViewPXRef.current ||
            lastAppliedViewPXRef.current.x !== style.activeViewPX.x ||
            lastAppliedViewPXRef.current.y !== style.activeViewPX.y;

        // Preserve existing anti-reset guard, except when container resize changes activeViewUNIT.
        if (dataZoomChangeActive.current && !viewChanged) return;
        if (!windowChanged) return;

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
        lastAppliedViewPXRef.current = style.activeViewPX;

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
    const spacePerPerson = Object.entries(roomRef.current).reduce((acc, [roomID, room]) => {
        const area = room.x * room.y;
        const areaPerPerson = queue[roomID] !== 0 ? area / queue[roomID] : area;
        const baseDiameter = Math.min(0.6, Math.sqrt(areaPerPerson / Math.PI)) * 2;
        let dia = [baseDiameter, baseDiameter];
        const r2 = Math.pow(baseDiameter * 0.5, 2);
        if (dia[0] < 0.6 && areaPerPerson > 0.2121) {
            dia = [0.6, ((areaPerPerson / Math.PI) / 0.3) * 2];
        } else if (areaPerPerson <= 0.2121) {
            dia = [r2 * (0.3 / (0.3 * 0.225)) * 2, r2 * (0.225 / (0.3 * 0.225)) * 2];
        }
        return {
            ...acc,
            [roomID]: {
                area: areaPerPerson,
                ellipseDiameter: dia,
            }
        }
    }, {});

    const chartSeries = useMemo(() => {
        if (isLoading) return [];

        const master = {
            animation: false,
            animationDurationUpdate: 100,
        };

        return Object.entries(locSliced ?? {}).reduce((acc, [roomID, locList]) => {
            const seriesPersons = {
                ...master,
                name: `[${roomID}] Passenger x ${locList.length}`,
                type: 'scatter',
                data: locList,
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
                name: `[${roomID}] Body Area`,
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
                name: `[${roomID}] Occupied Area`,
                type: 'scatter',
                data: locList,
                symbol: 'circle',
                symbolSize: spacePerPerson[roomID].ellipseDiameter.map(d => d * unitPX),
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
                id: `room-${roomID}`,
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
                data: roomRef.current[roomID].lines,
                tooltip: { show: false },
            }
            const seriesHandles = {
                id: `roomHandles-${roomID}`,
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
                data: roomRef.current[roomID].handles,
                z: 10,
            }
            const roomSeries = [seriesRoom, seriesHandles];
            return [...acc, ...popSeries, ...roomSeries];
        }, []);

    }, [locSliced, unitPX]);

    // const chartLegend = useMemo(() => {
    //     if (isLoading)  return [];
    //     const factor = 1.4;
    //     const areaLabel = areaPerHead < 9 ? areaPerHead.toFixed(1) : '>9';
    //     return [{
    //         bottom: 20 * factor,
    //         left: 26 * factor,
    //         itemWidth: 55 * factor,
    //         itemHeight: 55 * factor,
    //         itemStyle: { borderWidth: 0.5 },
    //         textStyle: {
    //             color: themeColor,
    //             height: 10 * factor,
    //             fontSize: 14 * factor,
    //             font: 'open-sans-light',
    //             padding: [0, 0, 0, 4 * factor],
    //             rich: {
    //                 prefix: {
    //                     fontSize: 14 * factor,
    //                     lineHeight: 16 * factor,
    //                     align: 'left',
    //                 },
    //                 value: {
    //                     fontWeight: 'bold',
    //                     fontSize: 14 * factor,
    //                     lineHeight: 16 * factor,
    //                     align: 'left',
    //                 },
    //                 unit: {
    //                     fontSize: 11 * factor,
    //                     lineHeight: 14 * factor,
    //                     align: 'center',
    //                 },
    //             },
    //         },
    //         formatter: () => `{prefix|×}{value|${0}}\n{unit|passenger}`,
    //         data: [{ name: `Passenger x ${0}`, icon: style.icon.personPlan }],
    //     }, {
    //         bottom: 20 * factor,
    //         left: 20 * factor,
    //         itemWidth: 65 * factor,
    //         itemHeight: 50 * factor,
    //         formatter: ' ',
    //         itemStyle: { borderWidth: 1.2, borderType: 'dashed' },
    //         data: [{ name: 'Body Area', icon: style.icon.ellipse }],
    //         inactiveColor: 'transparent',
    //         inactiveBorderWidth: 2.0,
    //     }, {
    //         bottom: 88 * factor,
    //         left: 20 * factor,
    //         itemWidth: 65 * factor,
    //         itemHeight: 65 * factor,
    //         textStyle: {
    //             color: themeColor,
    //             height: 20 * factor,
    //             font: 'open-sans-light',
    //             padding: [0, 0, 0, -51 * factor], // gap from icon
    //             rich: {
    //                 value: {
    //                     fontWeight: 'bold',
    //                     fontSize: 18 * factor,
    //                     lineHeight: 16 * factor,
    //                     align: 'center',
    //                 },
    //                 unit: {
    //                     fontSize: 11 * factor,
    //                     lineHeight: 14 * factor,
    //                     align: 'center',
    //                 },
    //             },
    //         },
    //         formatter: () => `{value|${areaLabel}}\n{unit|m²/p}`,
    //         data: [{ name: 'Occupied Area', icon: 'circle' }],
    //     }];
    // }, [isLoading, areaPerHead]);

    // ----------------------------------------------------------------------------
    // ADD SERIES TO CHART
    // Triggered by [PROPS + REF/THROTTLE] locSliced, [REF]roomRef, [STATE]unitPX
    const chartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        return {
            ...baseChartOption,
            series: [...baseChartOption.series, ...chartSeries],
            // legend: chartLegend,
        }
    }, [isLoading, baseChartOption, chartSeries]);

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
