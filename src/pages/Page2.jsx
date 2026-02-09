import React from 'react';
import ReactECharts from 'echarts-for-react';
import ThreeViewport from '../components/ThreeViewport';
import './Page2.css';

function Page2() {
  // Simple line chart configuration
  const chartOption = {
    title: {
      text: 'Sample Chart',
      left: 'center',
      textStyle: { color: '#333' }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'line',
        smooth: true
      }
    ]
  };

  return (
    <div className="page2-container">
      {/* Three.js viewport in the background */}
      <ThreeViewport />
      
      {/* Container 1: Top header with buttons */}
      <div className="floating-container header-container">
        <h3>Control Panel</h3>
        <div className="button-group">
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </div>
      </div>
      
      {/* Container 2: Left sidebar panel */}
      <div className="floating-container left-panel">
        {/* Left panel content - empty for now */}
      </div>
      
      {/* Container 3: Bottom chart container */}
      <div className="floating-container chart-container">
        <ReactECharts 
          option={chartOption} 
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  );
}

export default Page2;
