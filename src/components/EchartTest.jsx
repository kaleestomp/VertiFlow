import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { colorConfig } from '../utils/Config';
/**
 * Example: Line chart using DataFrame data with ECharts dataset
 */
function EchartTest({ chartOption, isLoading }) {

    // const [chartOption, setChartOption] = useState(_chartOption);
    // const [isLoading, setIsLoading] = useState(_isLoading);

    if (!chartOption) {
        return <div>Loading chart...</div>;
    }

    return (
        <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            showLoading={isLoading}
        />
    );
}

export default TimelineChart;
