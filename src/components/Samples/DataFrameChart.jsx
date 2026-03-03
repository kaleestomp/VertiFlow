import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../../utils/Config';

/**
 * Example: Line chart using DataFrame data with ECharts dataset
 */
function DataFrameChart({data}) {
  const style = {
    chartWidth: "100%",
    chartHeight: 500,
    marginSide: 40,
    marginTop: 40,
    xRef: null,
    yRef: null,
  }; 
  const sim_id = 605;
  const [chartOption, setChartOption] = useState(null);
  const isLoading = !Array.isArray(data) || data.length < 2 || !Array.isArray(data[0]);
  const loadingState = {
    // title: { text: 'Timeline', left: 'center' },
    title: {text: 'Timeline', left: 'center'},
    // I can do this hahaha 
    // I'm not sure how this usually goes but it is reall pretty 
    // How do you type with one hand anywauys
    // I bet i can do it yooooooo yoooo yoooo   
    // graphic: {
    //   type: 'text',
    //   left: 'center',
    //   top: 'middle',
    //   style: { 
    //     text: 'Loading Data...', 
    //     fontSize: 14, 
    //     fill: '#999' 
    //   }
    // }
  };

  const lineSeries = {
      name: "Average",
      type: "line",
      encode: {x: "time", y: "awt"},
      symbol: "circle",
      symbolSize: 10,
      showSymbol: false,
      lineStyle: {"color": colorConfig.primaryBlue, "width": 2.4},
      itemStyle: {"color": colorConfig.primaryBlue}, // This controls the symbol in tooltip panel
      emphasis: {
        focus: "series",
        scale: false,
          lineStyle: {color: colorConfig.primaryBlue},
      },
      tooltip: {"show": true, "trigger": "item"},
      z: 15,
  };
  const domainSeries = [
    {
      name: "Domain",
      type: "line",
      stack: `domain_${sim_id}`,
      encode: {x: "time", y: "min_awt"},
      symbol: "none",
      lineStyle: {"color": colorConfig.primaryBlue, "width": 0.25, "type": "dashed", "opacity": 1}, 
      areaStyle: {"color": "transparent"},
      emphasis: {"disabled": true, "focus": "none"},
      // tooltip: {"show": false},
      // silent: true,
      z: 1,
    },{
      name: "Domain",
      type: "line",
      stack: `domain_${sim_id}`,
      encode: {x: "time", y: "awt_range"},
      symbol: "none",
      lineStyle: {"color": colorConfig.primaryBlue, "width": 0.25, "type": "dashed", "opacity": 1}, 
      areaStyle: {"color": colorConfig.secondaryBlue, "opacity": 0.25},
      emphasis: {"disabled": true, "focus": "none"},
      // tooltip: {"show": false},
      // silent: true,
      z: 1,
    }
  ]
  const scatterSeries = {
      "name": "Individual Wait Time",
      "type": "scatter",
      "symbol": "circle",
      "symbolSize": 4,
      "itemStyle": {"opacity": 0.25, "color": colorConfig.primaryBlue},
      "blendMode": 'source-over',
      "large": true,
      "largeThreshold": 200,
      "silent": true,
      "tooltip": {"show": false},
      "z": 4,
  };
  const intervalSeries = {
    name: "Interval",
    type: "line",
    symbol: "none",
    data: [],
    markLine: {
      label: {"show": true, "formatter": "{b}", "position": "insideEndBottom"},  // Display x-axis value as label
      data: Array.from(
        { length: Math.floor(data.length / 300) },
        (_, idx) => {
          const i = idx + 1;
          return { name: data[i * 300][0], xAxis: i * 300 };
        }
      ),
      lineStyle: {
          color: "rgba(0,0,0,0.18)",
          type: "dashed",
      },
      arrow: {"show": false},
      symbol: "none",
    },
    tooltip: {"show": false},
    silent: true,
    animation: false,
    z: 99,
  };
  const allSeries = [lineSeries, ...domainSeries, intervalSeries];
  const legend = {
      show: true,
      top: 5,
      right: style.marginSide,
      data: [
        {name: "Domain", icon: "rect",},
        {name: "Average", icon: "rect",},
        {name: "Individual Wait Time", icon: "circle", },
        {name: "Global Average", icon: "line",},
      ],
      selected: {
        "Domain": true,  
        "Average": true,
        "Global Average": true,     
        "Individual Wait Time": true,
      },
      itemStyle: {color: "rgb(200,200,200)"},
  };
  const initialState = {
    // title: {text: 'Timeline Data', left: 'center'},
    tooltip: {
      trigger: 'axis'
    },
    legend: legend,
    dataset: {
      source: data  // Use DataFrame data directly
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value'
    },
    series: allSeries,
    axisPointer: {
      link: {xAxisIndex: 'all'},
    },
    tooltip: {
        trigger: "axis",
        // position: [50, 5],
      axisPointer: {"type": "cross", "animation": false},
        snap: true,
        z: 25,
    },
    dataZoom: [
      {type: 'inside'},
      {
        type: 'slider',
        showDataShadow: true,
        height: 25,
      },
      // {
      //   type: 'slider',
      //   orient: 'vertical',
      //   width: 25,
      //   filterMode: "none",
      //   showDataShadow: false,
      // },
    ],
    grid: {
      show: false, 
      left: style.marginSide, 
      right: style.marginSide, 
      top: style.marginTop
    },
  };
  

  
  useEffect(() => {
    // console.log('DataFrameChart received data:', data);
    try {
      if (isLoading) {
        setChartOption(loadingState);
        return;
      }
      // // Get column names to use first numeric columns for chart
      // const columns = df.columns;
      // const numericCols = columns.filter((col, idx) => {
      //   // Skip first column (likely index/date)
      //   // if (idx === 0) return false;
      //   const firstVal = df[col].values[0];
      //   return typeof firstVal === 'number';
      // });

      // const header = data[0];
      // const xKey = header.includes('time') ? 'time' : header[0];
      // const yKey = header.includes('queue_length') ? 'queue_length' : header[1];
      
      // Create ECharts option with dataset
      const option = initialState;
      
      setChartOption(option);
    } catch (error) {
      console.error('Error loading dataframe file:', error);
      setChartOption({
        title: { text: 'Error Loading Data', left: 'center' },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'Failed to load timeline_logbook.csv\nCheck console for details',
            fontSize: 14,
            fill: '#999'
          }
        }
      });
    }
    
  }, [data]);

  if (!chartOption) {
    return <div>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactECharts 
        option={chartOption} 
        style={{ height: '100%', width: '100%' }}
        showLoading={isLoading}
      />
    </div>
  );
}

export default DataFrameChart;
