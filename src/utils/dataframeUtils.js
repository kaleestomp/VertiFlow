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
 * Load data from CSV file using Danfo.js
 * @param {string} filePath - Path or URL to CSV file
 * @returns {Promise<Object>} Promise that resolves to JSON representation of CSV data
 */
export async function loadCSVtoJSON(filePath) {  
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    const dfd = window.dfd;
    if (!dfd) {
      throw new Error('Danfo.js is not loaded on window.dfd');
    }
    return await dfd.readCSV(filePath);
  }

  const fs = await import('fs/promises');
  const csvText = await fs.readFile(filePath, 'utf8');

  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      columns: [],
      values: [],
      shape: [0, 0],
      toJSON: () => [],
    };
  }

  const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === '"') {
        const nextChar = line[index + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const columns = parseCsvLine(lines[0]);
  const values = lines.slice(1).map((line) => {
    const parsed = parseCsvLine(line);
    return columns.map((_, colIndex) => parsed[colIndex] ?? null);
  });

  return {
    columns,
    values,
    shape: [values.length, columns.length],
    toJSON: () => values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]]))),
  };
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
