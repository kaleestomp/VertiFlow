
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
 * Convert ECharts dataset.source (list-of-lists) to Danfo DataFrame.
 * @param {Array<Array<any>>} source - ECharts dataset.source
 * @param {Object} options
 * @param {boolean} options.hasHeader - true if first row is column names
 * @returns {dfd.DataFrame}
 */
export function fromDataset(source, { hasHeader = true } = {}) {
  if (!Array.isArray(source) || source.length === 0) {
    return new dfd.DataFrame([]);
  }

  if (!Array.isArray(source[0])) {
    throw new Error("Invalid dataset: expected list-of-lists.");
  }

  if (hasHeader) {
    const columns = source[0].map((c) => String(c));
    const values = source.slice(1);
    return new dfd.DataFrame(values, { columns });
  }

  return new dfd.DataFrame(source);
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
