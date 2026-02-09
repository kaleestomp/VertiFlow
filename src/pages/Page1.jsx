import React from 'react';
import DataFrameChart from '../components/DataFrameChart';
import DataFrameGrid from '../components/DataFrameGrid';
import './Page1.css';

function Page1() {
  return (
    <div className="page1-container">
      <h1>Page 1</h1>
      
      <div className="container-wrapper">
        <div className="empty-container container-1">
          <DataFrameChart />
        </div>
        
        <div className="empty-container container-2">
          <DataFrameGrid />
        </div>
      </div>
    </div>
  );
}

export default Page1;
