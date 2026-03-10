import React, { useCallback, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';
const STYLE = {
  chartWidth: "100%",
  chartHeight: 500,
  marginLeft: 40,
  marginRight: 15,
  marginTop: 0,
  marginBottom: 50,
  dataZoomSliderHeight: 20,
  xRef: null,
  yRef: null,
};

/**
 * NOTE
 */
function TimelineChart({ data, _style, onHover }) {
  // console.log('TimelineChart Rendered with data:', data);
  const style = useMemo(() => ({ ...STYLE, ..._style }), [_style]);
  const sim_id = 605;
  const isLoading = !Array.isArray(data) || data.length < 2 || !Array.isArray(data[0]);
  const loadingState = {
    title: { text: 'Timeline', left: 'center' },
  };

  // Why prefer useMemo for chartOption?
  // useMemo avoids the extra render cycle caused by useEffect + setState.
  // It keeps your code cleaner and more efficient for computed values used directly in FIRST render.

  const chartOption = useMemo(() => {
    if (isLoading) return loadingState;
    const lineSeries = {
      name: "Average",
      type: "line",
      encode: { x: "time", y: "awt" },
      symbol: "circle",
      symbolSize: 10,
      showSymbol: false,
      lineStyle: { "color": colorConfig.primaryBlue, "width": 2.4 },
      itemStyle: { "color": colorConfig.primaryBlue },
      emphasis: {
        focus: "none",
        scale: false,
        lineStyle: { color: colorConfig.primaryBlue },
      },
      tooltip: { "show": true, "trigger": "item" },
      z: 15,
    };
    const domainSeries = [
      {
        name: "Domain",
        type: "line",
        stack: `domain_${sim_id}`,
        encode: { x: "time", y: "min_awt" },
        symbol: "none",
        lineStyle: { "color": colorConfig.primaryBlue, "width": 0.25, "type": "dashed", "opacity": 1 },
        areaStyle: { "color": "transparent" },
        emphasis: { "disabled": true, "focus": "none" },
        z: 1,
      },
      {
        name: "Domain",
        type: "line",
        stack: `domain_${sim_id}`,
        encode: { x: "time", y: "awt_range" },
        symbol: "none",
        lineStyle: { "color": colorConfig.primaryBlue, "width": 0.25, "type": "dashed", "opacity": 1 },
        areaStyle: { "color": colorConfig.secondaryBlue, "opacity": 0.25 },
        emphasis: { "disabled": true, "focus": "none" },
        z: 1,
      }
    ];
    const scatterSeries = {
      name: "Individual Wait Time",
      type: "scatter",
      symbol: "circle",
      symbolSize: 4,
      itemStyle: { "opacity": 0.25, "color": colorConfig.primaryBlue },
      blendMode: 'source-over',
      large: true,
      largeThreshold: 200,
      silent: true,
      tooltip: { "show": false },
      z: 4,
    };
    const intervalSeries = {
      name: "Interval",
      silent: true,
      animation: false,
      type: "line",
      symbol: "none",
      data: [],
      markLine: {
        silent: true,
        label: {
          show: true,
          position: "insideEndBottom",
          color: colorConfig.secondaryGrey,
          formatter: (value) => {
            const timestamp = value.name;
            const hhmm = timestamp.split(':')[0] + ':' + timestamp.split(':')[1];
            return `${hhmm}`;
          },
        },
        data: Array.from(
          { length: Math.floor(data.length / 300) },
          (_, idx) => {
            const i = idx + 1;
            return { name: data[i * 300][0], xAxis: i * 300 };
          }
        ),
        lineStyle: {
          color: colorConfig.secondaryGrey,
          type: "dashed",
        },
        arrow: { "show": false },
        symbol: "none",
      },
      z: 99,
    };
    const allSeries = [lineSeries, ...domainSeries, intervalSeries];
    const legend = {
      show: false,
      top: 5,
      right: STYLE.marginLeft,
      data: [
        { name: "Domain", icon: "rect" },
        { name: "Average", icon: "rect" },
        { name: "Individual Wait Time", icon: "circle" },
        { name: "Global Average", icon: "line" },
      ],
      selected: {
        "Domain": true,
        "Average": true,
        "Global Average": true,
        "Individual Wait Time": true,
      },
      itemStyle: { color: "rgb(200,200,200)" },
    };

    return {
      title: { show: false },
      tooltip: {
        trigger: 'axis',
      },
      legend: legend,
      dataset: {
        source: data,
      },
      xAxis: {
        type: 'category',
        axisPointer: {
          show: true,
        },
        axisLabel: {
          formatter: (value) => {
            const hhmm = value.split(':')[0] + ':' + value.split(':')[1];
            return `${hhmm}`;
          }
        },
      },
      yAxis: {
        type: 'value',
        axisPointer: {
          show: true,
          lineStyle: {
            color: colorConfig.secondaryGrey,
          },
          label: {formatter: (param) => `${Math.round(param.value)}p`,}
        },
        axisLabel: {
          formatter: (value) => `${value}p`,
          showMinLabel: false,
          verticalAlign: 'top',
          verticalAlignMaxLabel: 'top',
        },

      },
      series: allSeries,
      axisPointer: {
        // link: [{ xAxisIndex: 'all' }],
        snap: true,
      },
      tooltip: {
        trigger: "axis",
        showContent: false,
        axisPointer: {
          type: "cross",
          animation: false,
          label: {
            backgroundColor: colorConfig.primaryBlack,
            fontWeight: "bold",
          },
          lineStyle: {
            color: colorConfig.primaryBlack,
          },
        },
        snap: true,
        z: 25,
      },
      dataZoom: [
        { type: 'inside' },
        {
          type: 'slider',
          height: style.dataZoomSliderHeight,
          bottom: 0,
          // xAxisIndex: [0],
          showDataShadow: 'auto',
          showDetail: false,
          // backgroundColor: colorConfig.tertiaryGrey,
          fillerColor: 'transparent',
          borderColor: colorConfig.secondaryGrey,
          borderRadius: style.dataZoomSliderHeight / 2,
          dataBackground: {
            lineStyle: {
              color: colorConfig.secondaryGrey,
              width: 0.25,
            },
            areaStyle: {
              color: colorConfig.secondaryGrey,
              shadowBlur: style.dataZoomSliderHeight / 4,
              shadowColor: colorConfig.secondaryGrey,
            }
          },
          selectedDataBackground: {
            lineStyle: {
              color: colorConfig.primaryGrey,
              width: 0.5,
            },
            areaStyle: {
              color: colorConfig.primaryGrey,
              shadowBlur: style.dataZoomSliderHeight / 4,
              shadowColor: colorConfig.primaryGrey,
            }
          },
          moveHandleSize: 0,
          handleIcon: 'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z',
          handleSize: '100%',
          handleStyle: {
            borderColor: colorConfig.primaryGrey,
            borderWidth: 0.5,
            color: '#ffffff',
          },
        },
      ],
      grid: {
        show: false,
        left: style.marginLeft,
        right: style.marginRight,
        top: style.marginTop,
        bottom: style.marginBottom,
      },
    };
  }, [
    data,
    isLoading,
    sim_id,
    style.dataZoomSliderHeight,
    style.marginBottom,
    style.marginLeft,
    style.marginRight,
    style.marginTop,
  ]);

  // const [hoverPoint, setHoverPoint] = useState(null);
  const handleAxisHover = useCallback((event) => {
    const axisInfo = event?.axesInfo?.[0];
    if (!axisInfo || !Array.isArray(data) || data.length === 0) return;
    const rawValue = axisInfo.value;
    let index = Number(rawValue);
    if (!Number.isInteger(index)) {
      return;
      // const valueLabel = axisInfo.valueLabel;
      // index = data.findIndex((row) => row?.[0] === valueLabel || row?.[0] === rawValue);
    }
    if (index < 0 || index >= data.length) return;
    
    const x = data[index]?.[0];
    const queue = data[index]?.[1];
    const nextPoint = { x, y: { 5: queue, 6: queue, 7: queue } };
    // console.log('Timeline Hover Value:', data[index]);
    // setHoverPoint(nextPoint);
    onHover?.(nextPoint);
  }, [data, onHover]);

  const chartEvents = useMemo(() => ({
    updateAxisPointer: handleAxisHover,
  }), [handleAxisHover]);

  if (!chartOption) {
    return <div>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        showLoading={isLoading}
        onEvents={chartEvents}
      />
    </div>
  );
}

export default TimelineChart;
