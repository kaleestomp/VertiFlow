import React, { useEffect, useState } from 'react';
import { createDataFrame, filterDataFrame, toEChartsFormat } from '../utils/dataProcessing';

/**
 * Example component showing how to use the dataProcessing utilities
 */
function DataProcessingExample() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    // Example: Create sample data
    const sampleData = [
      { name: 'Alice', age: 25, score: 85 },
      { name: 'Bob', age: 30, score: 92 },
      { name: 'Charlie', age: 22, score: 78 },
      { name: 'Diana', age: 28, score: 95 },
      { name: 'Eve', age: 35, score: 88 },
    ];

    // Create DataFrame
    const df = createDataFrame(sampleData);
    
    // Filter: Get people with score > 85
    const filtered = filterDataFrame(df, 'score', 85, 'gt');
    
    // Convert back to array for display
    const filteredArray = filtered.values.map((row, i) => {
      return {
        name: row[0],
        age: row[1],
        score: row[2],
      };
    });
    
    setData(sampleData);
    setFilteredData(filteredArray);
    
    // Example: Prepare data for ECharts
    const chartData = toEChartsFormat(df, 'name', 'score');
    console.log('Chart data:', chartData);
    
  }, []);

  return (
    <div>
      <h2>Data Processing Example</h2>
      
      <div>
        <h3>Original Data:</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
      
      <div>
        <h3>Filtered Data (score {'>'} 85):</h3>
        <pre>{JSON.stringify(filteredData, null, 2)}</pre>
      </div>
    </div>
  );
}

export default DataProcessingExample;
