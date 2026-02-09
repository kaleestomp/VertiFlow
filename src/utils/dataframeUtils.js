/**
 * Load data from CSV file using Danfo.js
 * @param {string} filePath - Path or URL to CSV file
 * @returns {Promise<DataFrame>} Promise that resolves to Danfo DataFrame
 */
export async function loadCSV(filePath) {  
  const dfd = window.dfd;
  return await dfd.readCSV(filePath);
}

/**
 * Convert DataFrame to ECharts dataset format
 * @param {DataFrame} df - Danfo DataFrame
 * @returns {Array} Array format for ECharts dataset [header, ...rows]
 */
export function toEChartsDataset(df) {
  // Get column names as header row
  const header = df.columns;
  
  // Convert DataFrame values to rows
  const rows = df.values;
  
  // Return in ECharts dataset format: [header, row1, row2, ...]
  return [header, ...rows];
}

/**
 * Convert DataFrame to Material UI DataGrid format
 * @param {DataFrame} df - Danfo DataFrame
 * @returns {Object} {rows, columns} for MUI DataGrid
 */
export function toMUIDataGrid(df) {
  // Create columns definition
  const columns = df.columns.map(col => ({
    field: col,
    headerName: col,
    width: 150,
    editable: false,
  }));
  
  // Create rows with id field required by MUI DataGrid
  const rows = df.values.map((row, index) => {
    const rowObj = { id: index };
    df.columns.forEach((col, colIndex) => {
      rowObj[col] = row[colIndex];
    });
    return rowObj;
  });
  
  return { rows, columns };
}
