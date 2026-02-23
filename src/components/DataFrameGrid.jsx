import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { fromDataset, toMUIDataGrid } from '../utils/dataframeUtils';
import './DataFrameGrid.css';

function DataFrameGrid({data}) {
  const [gridData, setGridData] = useState({ rows: [], columns: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Load CSV file
      const df = fromDataset(data, { hasHeader: true });
      
      // Convert to MUI DataGrid format
      const MUIData = toMUIDataGrid(df);
      setGridData(MUIData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading CSV file:', error);
      // Set empty state with error message
      setGridData({ 
        rows: [], 
        columns: [{ 
          field: 'error', 
          headerName: 'Error', 
          width: 500,
          renderCell: () => 'Failed to load timeline_logbook.csv. Check console for details.'
        }] 
      });
      setLoading(false);
    }
    
  }, [data]);

  return (
    <div className="datagrid-container">
      <h3>Data Explorer</h3>
      <DataGrid
        rows={gridData.rows}
        columns={gridData.columns}
        loading={loading}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
        }}
        pageSizeOptions={[5, 10, 25, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f0f0f0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#fafafa',
            borderBottom: '2px solid #e0e0e0',
          },
        }}
      />
    </div>
  );
}

export default DataFrameGrid;
