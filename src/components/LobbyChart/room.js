// Initialize Room
export function initializeRoom(x, y) {
    return {
        x: x,
        y: y,
        handles: [
            [x * -0.5, 0],
            [0, y * 0.5],
            [x * 0.5, 0],
            [0, y * -0.5],
        ],
        lines: [
            [x * -0.5, y * -0.5], [x * -0.5, y * 0.5],
            [x * 0.5, y * 0.5], [x * 0.5, y * -0.5],
            [x * -0.5, y * -0.5],
        ]
    };
}

// Update Room
export function getRoomFrHandle(handleCoords) {
    const updatedLines = getLines(handleCoords);
    const updatedHandles = adjustHandle(updatedLines);
    return {
        ...getDimensions(handleCoords),
        handles: updatedHandles,
        lines: updatedLines,
    };
};

function getLines(handleCoords) {
    return [
        [handleCoords[0][0], handleCoords[3][1]], [handleCoords[0][0], handleCoords[1][1]],
        [handleCoords[2][0], handleCoords[1][1]], [handleCoords[2][0], handleCoords[3][1]],
        [handleCoords[0][0], handleCoords[3][1]],
    ]
};

function getDimensions(handleCoords) {
    const [left, top, right, bottom] = handleCoords
    const xDim = Math.abs(right[0] - left[0]);
    const yDim = Math.abs(top[1] - bottom[1]);
    return { x: xDim, y: yDim };
};

function adjustHandle(lines) {
    const [pt1, pt2, pt3, pt4] = lines;
    const xMid = pt1[0] + (pt4[0] - pt1[0]) * 0.5;
    const yMid = pt1[1] + (pt2[1] - pt1[1]) * 0.5;
    return [
        [pt1[0], yMid],
        [xMid, pt2[1]],
        [pt3[0], yMid],
        [xMid, pt4[1]],
    ]
};

// Update Axis
export function getAxisLimitFrHandle(handleCoords, axisParam = {}) {

    const paddingRatio = 0.4;
    const x1 = handleCoords[0][0];
    const x2 = handleCoords[2][0];
    const y1 = handleCoords[3][1];
    const y2 = handleCoords[1][1];
        
    let xAxis = {
        min: x1 - (x2 - x1) * paddingRatio,
        max: x2 + (x2 - x1) * paddingRatio,
    };
    if (axisParam.x) { 
        xAxis.min = Math.min(xAxis.min, axisParam.x.min); 
        xAxis.max = Math.max(xAxis.max, axisParam.x.max);
    }
    let yAxis = {
        min: y1 - (y2 - y1) * paddingRatio,
        max: y2 + (y2 - y1) * paddingRatio,
    };
    if (axisParam.y) {
        yAxis.min = Math.min(yAxis.min, axisParam.y.min);
        yAxis.max = Math.max(yAxis.max, axisParam.y.max);
    }

    return { 
        xAxis, 
        yAxis 
    };
}