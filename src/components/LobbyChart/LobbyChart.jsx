import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
import { getCoordinates } from '../../utils/populateRoom';
import { isNumber } from '@mui/x-data-grid/internals';

const STYLE = {
    chartWidth: "100%",
    chartHeight: 600,
    marginLeft: 40,
    marginRight: 40,
    marginTop: 20,
    marginBottom: 50,
    icon: {
        personPlan: 'path://M68.71,34.27c.53.19,1.07.38,1.6.58.17.09.35.17.52.26,2.83,2.21,5.99,4.11,8.43,6.69,4.86,5.13,2.92,12.94-3.9,15.97-2.36,1.05-5.12,1.21-7.7,1.76-.34.07-.69.1-1.03.14-1.2.47-2.4.94-3.6,1.42-.93.37-2.22.52-2.66,1.21-.33.53.42,1.74.68,2.65.08.3.12.6.18.9-.41-.83-.72-1.73-1.26-2.48-.27-.37-.94-.65-1.42-.63-.86.04-1.7.33-2.55.51-.03-.92-.06-1.85-.1-2.77.62-.49,1.32-.92,1.85-1.49.44-.47.69-1.11,1.02-1.67.52-.41,1.24-.72,1.53-1.26,3.19-5.78,3.2-11.66.39-17.58-1.23-1.53-2.45-3.05-3.68-4.58,3.19-.03,6.38-.06,9.57-.1.36.06.72.12,1.08.18.2.03.4.06.61.09.14.06.28.12.42.18Z M30.33,59.68c-2.61-.46-5.36-.56-7.8-1.46-5.58-2.07-8.27-6.86-7.18-12.09.68-3.23,3-5.35,5.32-7.41,3.86-3.42,8.24-5.42,13.57-4.91,1.88.18,3.8.06,5.7.08-.04.09-.06.21-.13.27-3.01,2.33-5.03,5.22-5.21,9.15-.1.24-.21.47-.31.71,0,1.9.02,3.81.03,5.71l.29.69c.01.26.02.53.03.79.13.37.25.74.38,1.11.12.55.23,1.1.35,1.65.24.36.48.72.72,1.09l1.94,2.89c.15.08.29.16.44.24,0,0-.02-.02-.02-.02.18.22.35.44.53.66.71.62,1.41,1.24,2.12,1.86-.1.86-.21,1.72-.31,2.59-1.24-.19-2.48-.37-3.72-.56-1.14-.65-2.24-1.39-3.43-1.94-1.05-.48-2.2-.74-3.31-1.1Z M30.33,59.68c1.11.36,2.26.62,3.31,1.1,1.19.54,2.29,1.28,3.43,1.94-1.12,1.9-2.14,3.88-3.46,5.63-.3.39-1.66-.02-2.54-.06-.11-.14-.23-.27-.34-.41-.14-.31-.28-.61-.42-.92-.1-.39-.2-.77-.3-1.16,0-.92,0-1.84,0-2.76.1-.88.19-1.77.29-2.65.01-.24.03-.48.04-.72Z M61.24,65.87c-.06-.3-.1-.61-.18-.9-.26-.91-1.01-2.12-.68-2.65.44-.69,1.73-.84,2.66-1.21,1.2-.48,2.4-.95,3.6-1.42,0,.25.02.5.02.76.09.74.18,1.48.27,2.22,0,1.11,0,2.22,0,3.33-.22.61-.45,1.22-.67,1.82-.23.26-.45.52-.68.78-.24.1-.47.2-.71.3-.19,0-.39,0-.58-.01-.18-.08-.36-.17-.54-.25-.1-.05-.21-.09-.31-.14-.16-.11-.32-.23-.48-.34-.07-.07-.14-.13-.2-.2-.14-.15-.28-.3-.42-.44,0,0,0,0,0,0-.33-.44-.66-.87-.98-1.31-.04-.11-.08-.22-.12-.33Z M40.78,63.27c.1-.86.21-1.72.31-2.59,2.23.93,4.45,1.88,6.7,2.77.38.15.93.21,1.29.05,2.3-.96,4.56-2,6.84-3.01.03.92.06,1.85.1,2.77-1.75.27-3.5.76-5.24.75-3.17-.02-6.34-.35-9.52-.56-.16-.01-.32-.12-.47-.19Z M30.29,60.4c-.1.88-.19,1.77-.29,2.65.1-.88.19-1.77.29-2.65Z M66.93,62.65c-.09-.74-.18-1.48-.27-2.22.09.74.18,1.48.27,2.22Z M66.27,67.81c.22-.61.45-1.22.67-1.82-.22.61-.45,1.22-.67,1.82Z M61.36,66.2c.33.44.66.87.98,1.31-.33-.44-.66-.87-.98-1.31Z M30,65.8c.1.39.2.77.3,1.16-.1-.39-.2-.77-.3-1.16Z M67.68,34.01c-.36-.06-.72-.12-1.08-.18.36.06.72.12,1.08.18Z M64.88,68.89c.24-.1.47-.2.71-.3-.24.1-.47.2-.71.3Z M63.75,68.63c.18.08.36.17.54.25-.18-.08-.36-.17-.54-.25Z M62.96,68.15c.16.11.32.23.48.34-.16-.11-.32-.23-.48-.34Z M30.73,67.88c.11.14.23.27.34.41-.11-.14-.23-.27-.34-.41Z M62.34,67.51c.14.15.28.3.42.44-.14-.15-.28-.3-.42-.44Z M70.84,35.11c-.17-.09-.35-.17-.52-.26.17.09.35.17.52.26Z M68.71,34.27c-.14-.06-.28-.12-.42-.18.14.06.28.12.42.18Z M60.71,38.5c-1.23-1.53-2.45-3.05-3.68-4.58-5.69-3.74-11.39-3.8-17.09-.04-.04.09-.06.21-.13.27-3.01,2.33-5.03,5.22-5.21,9.15-.1.24-.21.47-.31.71,0,1.9.02,3.81.03,5.71.1.23.2.46.29.69.01.26.02.53.03.79.14.07.28.14.42.21-.01.3-.02.6-.04.9.12.55.23,1.1.35,1.66.24.36.48.72.72,1.09.65.96,1.29,1.93,1.94,2.89.15.08.29.16.44.24,0,0-.02-.02-.02-.02.5.26,1,.52,1.5.78.37.1.74.21,1.11.31.08.02.16.04.25.06,4.87.41,9.32-.81,13.52-3.25.44-.26,1.3.03,1.9.24.72.25,1.38.68,2.07,1.04.52-.41,1.24-.72,1.53-1.26,3.19-5.78,3.2-11.66.39-17.58Z M41.3,59.33c4.87.41,9.32-.81,13.52-3.25.44-.26,1.3.03,1.9.24.72.25,1.38.68,2.07,1.04-.33.56-.58,1.21-1.02,1.67-.54.57-1.23,1-1.85,1.49-2.28,1.01-4.54,2.04-6.84,3.01-.36.15-.91.1-1.29-.05-2.25-.89-4.47-1.84-6.7-2.77-.71-.62-1.41-1.24-2.12-1.86.33.04.65.08.98.13.37.1.74.21,1.11.31.08.02.16.04.25.06Z M39.95,58.96c-.32-.04-.65-.08-.98-.13-.18-.22-.35-.44-.53-.66.5.26,1,.52,1.5.78Z M35.36,53.97c.24.36.48.72.72,1.09-.24-.36-.48-.72-.72-1.09Z M35.05,51.42c-.01.3-.02.6-.04.9-.13-.37-.25-.74-.38-1.11.14.07.28.14.42.21Z M34.31,49.72c.1.23.2.46.29.69-.1-.23-.2-.46-.29-.69Z M34.6,43.3c-.1.24-.21.47-.31.71.1-.24.21-.47.31-.71Z M38.02,57.95c.15.08.29.16.44.24-.15-.08-.29-.16-.44-.24Z M41.3,59.33c-.08-.02-.17-.04-.25-.06.08.02.16.04.25.06Z',
        bodyEllipse: 'path://M 0,-225 A 300,225 0 1,0 0,225 A 300,225 0 1,0 0,-225',
        handleIcon: 'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z',
    }
};

export default function LobbyChart({ queue=15, worstQueue=30, _style={} }) {

    // props
    // const queue = 15;
    // const worstQueue = 30;

    // States
    const [roomDims, setRoomDim] = useState({ x: 8, y: 4 });
    const scaleFactor = 100;
    const themeColor = colorConfig.primaryBlue;
    const areaPerHead = roomDims.x * roomDims.y / queue;
    const diaPerHead = [0.6, 0.45].map(d => d * Math.min(2, (areaPerHead / Math.PI) / (0.6 * 0.45)));

    // Data Memo
    const locRegister = React.useMemo(() => {
        return getCoordinates(worstQueue, roomDims)
    }, [worstQueue, roomDims]);
    const locData = locRegister.slice(0, Math.min(queue, locRegister.length)).map(([x, y]) => {
        return { value: [x, y], symbolRotate: Math.floor(Math.random() * 360) };
    });
    // console.log(locData);

    // Setup
    const style = { ...STYLE, ..._style };
    const isLoading = !isNumber(queue) || !isNumber(worstQueue);
    const loadingState = {};
    
    const chartOption = React.useMemo(() => {
        if (isLoading) return loadingState;

        const seriesPersons = {
            name: `Passenger x ${queue}`,
            type: 'scatter',
            data: locData,
            symbol: style.icon.personPlan,
            symbolSize: [0.54 * scaleFactor, 0.3 * scaleFactor],
            itemStyle: {
                color: themeColor,
                borderColor: 'White',
                borderWidth: 1,
            },
        }
        const seriesBody = {
            name: 'Body Area',
            type: 'scatter',
            data: locData,
            symbol: style.icon.bodyEllipse,
            symbolSize: [0.6 * scaleFactor, 0.45 * scaleFactor],
            itemStyle: {
                color: 'transparent',
                borderColor: themeColor,
                borderWidth: 1.0,
                borderType: 'dashed',
            },
        }
        const seriesOccupied = {
            name: 'Occupied Area',
            type: 'scatter',
            data: locData,
            symbol: 'circle',
            symbolSize: diaPerHead.map(d => d * 2 * scaleFactor),
            itemStyle: {
                color: themeColor,
                opacity: 0.1,
                borderWidth: 0.0,
            },
            silent: true,
            tooltip: { show: false },
        }
        const seriesBoundary = {
            name: 'LobbyBoundary',
            type: 'scatter',
            data: [],
            itemStyle: {
                'symbol': style.icon.handleIcon,
                'color': 'white',
                'borderColor': themeColor,
                'borderWidth': 2.0,
            },
            markline: {
                silent: true,
                lineStyle: {
                    color: themeColor,
                    opacity: 0.2,
                    width: 4.0,
                    type: 'solid',
                },
                symbol: 'none',
                animation: false,
                data: [
                    [{ xAxis: 0, yAxis: 0 }, { xAxis: roomDims.x, yAxis: 0 }],
                    [{ xAxis: 0, yAxis: roomDims.y }, { xAxis: roomDims.x, yAxis: roomDims.y }],
                    [{ xAxis: 0, yAxis: 0 }, { xAxis: 0, yAxis: roomDims.y }],
                    [{ xAxis: roomDims.x, yAxis: 0 }, { xAxis: roomDims.x, yAxis: roomDims.y }],
                ],
            },
        }
        const allSeries = [seriesPersons, seriesBody, seriesOccupied, seriesBoundary];
        const legend = {
            top: style.marginTop * 0.25,
            right: style.marginRight,
            itemWidth: scaleFactor * 0.25,
            itemHeight: scaleFactor * 0.25,
            data: [
                { name: seriesBody.name, icon: style.icon.bodyEllipse },
                { name: seriesPersons.name, icon: style.icon.personPlan },
                { name: seriesOccupied.name, icon: 'circle' },
            ]
        };
        const yAxis = {
            type: 'value',
            min: 0,
            max: roomDims.y,
            interval: 1.0,
            minInterval: 1.0,
            maxInterval: 2.0,
            axisLine: { show: false },
            axisTick: { show: true },
            axisLabel: { show: true },
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
        const xAxis = {
            ...yAxis, ...{
                max: roomDims.x,
            }
        };

        const grid = {
            left: style.marginLeft,
            right: style.marginRight,
            top: style.marginTop,
            bottom: style.marginBottom,
        };
        const tooltip = { show: false };

        return {
            grid: grid,
            xAxis: xAxis,
            yAxis: yAxis,
            series: allSeries,
            legend: legend,
            tooltip: tooltip,
        }
    }, [locData, style]);

    if (!chartOption) {
        return <div>Loading chart...</div>;
    }

    return (
        <div style={{ width: '100%', height: style.chartHeight }}>
            <ReactECharts
                option={chartOption}
                style={{ height: '100%', width: '100%' }}
                showLoading={isLoading}
            />
        </div>
    );
}
