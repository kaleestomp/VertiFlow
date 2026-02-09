/**
 * Data Processing Utilities using Danfo.js
 * 
 * This file contains reusable dataframe processing functions.
 * Import these functions into your React components as needed.
 * 
 * Note: Danfo.js is loaded via CDN in index.html
 * Access it through window.dfd (dfd = danfo)
 */

/**
 * Example: Create a DataFrame from an array of objects
 * @param {Array} data - Array of objects with consistent keys
 * @returns {DataFrame} Danfo.js DataFrame
 */
export function createDataFrame(data) {
  const dfd = window.dfd;
  return new dfd.DataFrame(data);
}

/**
 * Example: Filter DataFrame rows based on a condition
 * @param {DataFrame} df - Input DataFrame
 * @param {string} column - Column name to filter on
 * @param {*} value - Value to compare against
 * @param {string} operator - Comparison operator ('eq', 'gt', 'lt', 'gte', 'lte')
 * @returns {DataFrame} Filtered DataFrame
 */
export function filterDataFrame(df, column, value, operator = 'eq') {
  const operators = {
    eq: (col) => col.eq(value),
    gt: (col) => col.gt(value),
    lt: (col) => col.lt(value),
    gte: (col) => col.gte(value),
    lte: (col) => col.lte(value),
  };
  
  const condition = operators[operator](df[column]);
  return df.loc({ rows: condition });
}

/**
 * Example: Group by and aggregate
 * @param {DataFrame} df - Input DataFrame
 * @param {string} groupByColumn - Column to group by
 * @param {string} aggColumn - Column to aggregate
 * @param {string} aggFunc - Aggregation function ('sum', 'mean', 'count', 'max', 'min')
 * @returns {DataFrame} Grouped and aggregated DataFrame
 */
export function groupAndAggregate(df, groupByColumn, aggColumn, aggFunc = 'sum') {
  const grouped = df.groupby([groupByColumn]);
  return grouped[aggFunc]()[aggColumn];
}

/**
 * Example: Convert DataFrame to array of objects
 * @param {DataFrame} df - Input DataFrame
 * @returns {Array} Array of objects
 */
export function dataFrameToArray(df) {
  return df.values.map((row, i) => {
    const obj = {};
    df.columns.forEach((col, j) => {
      obj[col] = row[j];
    });
    return obj;
  });
}

/**
 * Example: Get basic statistics for a DataFrame
 * @param {DataFrame} df - Input DataFrame
 * @returns {Object} Statistics object
 */
export function getStatistics(df) {
  return {
    describe: df.describe(),
    shape: df.shape,
    columns: df.columns,
    dtypes: df.dtypes,
  };
}

/**
 * Example: Sort DataFrame by column
 * @param {DataFrame} df - Input DataFrame
 * @param {string} column - Column to sort by
 * @param {boolean} ascending - Sort order (true for ascending, false for descending)
 * @returns {DataFrame} Sorted DataFrame
 */
export function sortDataFrame(df, column, ascending = true) {
  return df.sortValues(column, { ascending });
}

/**
 * Example: Add a calculated column
 * @param {DataFrame} df - Input DataFrame
 * @param {string} newColumn - Name of new column
 * @param {Function} calculateFn - Function that takes row data and returns new value
 * @returns {DataFrame} DataFrame with new column
 */
export function addCalculatedColumn(df, newColumn, calculateFn) {
  const values = df.values.map((row, i) => {
    const rowObj = {};
    df.columns.forEach((col, j) => {
      rowObj[col] = row[j];
    });
    return calculateFn(rowObj, i);
  });
  
  df.addColumn(newColumn, values, { inplace: true });
  return df;
}

/**
 * Example: Load data from CSV file
 * @param {string} filePath - Path or URL to CSV file
 * @returns {Promise<DataFrame>} Promise that resolves to DataFrame
 */
export async function loadCSV(filePath) {
  const dfd = window.dfd;
  return await dfd.readCSV(filePath);
}

/**
 * Load data from Feather file using Apache Arrow
 * @param {string|File} filePathOrFile - Path/URL to feather file or File object
 * @returns {Promise<DataFrame>} Promise that resolves to Danfo DataFrame
 */
export async function loadFeather(filePathOrFile) {
  const arrow = window.Arrow;
  const dfd = window.dfd;
  
  let buffer;
  
  // Handle File object or URL/path
  if (filePathOrFile instanceof File) {
    buffer = await filePathOrFile.arrayBuffer();
  } else {
    const response = await fetch(filePathOrFile);
    buffer = await response.arrayBuffer();
  }
  
  // Read Arrow table from feather format
  const table = arrow.tableFromIPC(new Uint8Array(buffer));
  
  // Convert Arrow table to plain object array
  const data = [];
  for (let i = 0; i < table.numRows; i++) {
    const row = {};
    table.schema.fields.forEach(field => {
      const column = table.getChild(field.name);
      row[field.name] = column.get(i);
    });
    data.push(row);
  }
  
  // Create Danfo DataFrame from the data
  return new dfd.DataFrame(data);
}

/**
 * Example: Convert DataFrame to format suitable for ECharts
 * @param {DataFrame} df - Input DataFrame
 * @param {string} xColumn - Column for x-axis
 * @param {string} yColumn - Column for y-axis
 * @returns {Object} ECharts data format {xData: [], yData: []}
 */
export function toEChartsFormat(df, xColumn, yColumn) {
  return {
    xData: df[xColumn].values,
    yData: df[yColumn].values,
  };
}

/**
 * Example: Merge two DataFrames
 * @param {DataFrame} df1 - First DataFrame
 * @param {DataFrame} df2 - Second DataFrame
 * @param {string} onColumn - Column to merge on
 * @param {string} how - Merge type ('inner', 'outer', 'left', 'right')
 * @returns {DataFrame} Merged DataFrame
 */
export function mergeDataFrames(df1, df2, onColumn, how = 'inner') {
  const dfd = window.dfd;
  return dfd.merge({ left: df1, right: df2, on: [onColumn], how });
}
