import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useRoom } from './useRoom';
import { usePopulation } from './usePopulation';
import { useDragHandlers } from './useDragHandlers';
import { useDataZoomSync } from './useDataZoomSync';
import { useUnitPXSync } from './useUnitPXSync';

import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
import { getSpacePerPerson } from './utils/room';
import { useElementSize } from '../../utils/observer';
import { getScaleInfo } from './utils/scale';
import { icons as lobbyIcons } from './utils/icons';

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

    // LOADING STATE CHECK
    const isLoading = !(queue && Object.keys(queue).length > 0 && maxQueue && Object.keys(maxQueue).length > 0);
    // ACCEPT PROPS + ACTIVE WINDOW -> DERIVE SCALE INFO
    let style = { ...STYLE, ..._style };

    // ----------------------------------------------------------------------------
    // INITIALIZE ROOM [ONMOUNT] // returns [REF, DERIVED VALUE]
    const { roomRef, initialRooms } = useRoom({ maxQueue, roomSpacing: style.roomSpacing });
    const roomIDs = useMemo(() => initialRooms ? Object.keys(initialRooms) : [], [initialRooms]);

    // ----------------------------------------------------------------------------
    // PARENT CONTAINER ACTIVE WINDOW [ON Window Resize]
    const { containerRef, size } = useElementSize();
    style = { ...style, ...getScaleInfo(STYLE, size, roomRef.current) }; // initialRooms

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART [ON PROPS: Rooms Params]
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
    }, [isLoading, initialRooms, style.roomSpacing]);

    // ----------------------------------------------------------------------------
    // INITIALIZE CHART REF & STATE
    const chartRef = useRef(null);
    const [chartReady, setChartReady] = useState(false);

    // ----------------------------------------------------------------------------
    // USER DRAG UPDATE [ON REF] // returns [STATE]
    const roomVersions = useDragHandlers({ chartRef, chartReady, roomRef, roomIDs });
    // POPULATION UPDATE LOGIC [ON PROPS, REF/THROTTLE] // returns [DERIVED VALUE]
    const locSliced = usePopulation({ isLoading, roomRef, roomVersions, maxQueue, queue });

    // ----------------------------------------------------------------------------
    // HANDLE UNIT SCALING ON ZOOM ( MOVE > 0.001 )
    const unitPX = useUnitPXSync({
        chartRef, chartReady,
        initialUnitPX: style.unitPX,
        activeViewPX: style.activeViewPX
    }); // returns [STATE]
    
    // USER ZOOM / WINDOW RESIZE
    const { dataZoomChangeActive, lastAppliedViewRef } = useDataZoomSync({
        chartRef, chartReady,
        roomRef, roomIDs,
        activeViewUNIT: style.activeViewUNIT,
        activeViewPX: style.activeViewPX,
    }); // returns [REFs]

    // ----------------------------------------------------------------------------
    // CREATE SERIES [ON THROTTLE]locSliced, [REF]roomRef, [STATE]unitPX
    const spacePerPerson = getSpacePerPerson(queue, roomRef.current);
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

    }, [locSliced, spacePerPerson, unitPX]);

    // ----------------------------------------------------------------------------
    // ADD SERIES TO CHART
    // Triggered by [PROPS + REF/THROTTLE] locSliced, [REF]roomRef, [STATE]unitPX
    const chartOption = useMemo(() => {
        if (isLoading) return LOADINGSTATE;
        return {
            ...baseChartOption,
            series: [...baseChartOption.series, ...chartSeries],
        }
    }, [isLoading, baseChartOption, chartSeries]);

    if (!chartOption) { return <div>Loading chart...</div>; }
    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
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