import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { loadCSV, toEChartsDataset } from '../utils/dataframeUtils';

/**
 * Example: Line chart using DataFrame data with ECharts dataset
 */
const TimelineChart = (Run, Floor) => {
  const [chartOption, setChartOption] = useState(null);

  useEffect(() => {
    // Load data from feather file
    const loadData = async () => {
      try {
        // Load CSV file from data folder
        const df = await loadCSV('/data/timeline_logbook.csv');
        // Convert to ECharts dataset format
        const dataset = toEChartsDataset(df);
        // console.log('Dataset for ECharts:', dataset);
        
        // Get column names to use first numeric columns for chart
        const columns = df.columns;
        const numericCols = columns.filter((col, idx) => {
          // Skip first column (likely index/date)
          // if (idx === 0) return false;
          const firstVal = df[col].values[0];
          return typeof firstVal === 'number';
        });
        
        // Create ECharts option with dataset
        const option = {
          title: {
            text: 'Timeline Data',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            top: 'bottom'
          },
          dataset: {
            source: dataset  // Use DataFrame data directly
          },
          xAxis: {
            type: 'category'
          },
          yAxis: {
            type: 'value'
          },
          series:{
              type: 'line',
              smooth: false,
              name: "queue_length",
              encode: {
                x: "time",  // First column for x-axis
                y: "queue_length"          // Each numeric column as a series
              }
          }
          // series: numericCols.slice(1, 3).map(col => {
          //   console.log('Creating series for column:', col);
          //   return ({
          //     type: 'line',
          //     smooth: false,
          //     name: col,
          //     encode: {
          //       x: columns[0],  // First column for x-axis
          //       y: col          // Each numeric column as a series
          //     }
          //   })
          // })
        };
        
        setChartOption(option);
      } catch (error) {
        console.error('Error loading feather file:', error);
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
    };
    
    loadData();
  }, []);

  if (!chartOption) {
    return <div>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactECharts 
        option={chartOption} 
        style={{ height: '100%', width: '100%' }}
        onEvents={{
          updateAxisPointer: (params) => {
            console.log('UpdateAxisPointer:', params.axesInfo.length > 0 ? `${params.axesInfo[0].axisDim}-${params.axesInfo[0].value}` : 'No axis info');
          }
        }}
      />
    </div>
  );
}

export default TimelineChart;
