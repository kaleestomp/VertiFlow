import { useElementSize } from '../../utils/observer';

export function getScaleInfo (style, winSize, rooms) {

    const { width, height } = winSize;
    const activeWidthPX = Math.max(1, (width ?? 0) - style.marginLeft - style.marginRight);
    const activeHeightPX = Math.max(1, (height ?? 0) - style.marginTop - style.marginBottom);

    const roomIDs = Object.keys(rooms ?? {})
    const xMax = rooms[roomIDs[roomIDs.length-1]].handles[2][0];
    const xMin = rooms[roomIDs[0]].handles[0][0];
    const totalX = xMax - xMin;
    const totalY = Object.values(rooms ?? {}).reduce(
        (height, room) => Math.max(height, (room?.y ?? 0)), 0
    );

    let activeWidthUNIT = totalX + style.initialZoomViewMinMargin * 2;
    let activeHeightUNIT = totalY + style.initialZoomViewMinMargin * 2;
    let unitPX = NaN;

    if (activeHeightUNIT/activeWidthUNIT > activeHeightPX/activeWidthPX) { // viewHeight dictates SCALE FACTOR
        unitPX = Math.round(activeHeightPX / activeHeightUNIT);
        activeWidthUNIT = Math.round(activeWidthPX / unitPX);
    } else { // viewWidth dictates SCALE FACTOR
        unitPX = Math.round(activeWidthPX / activeWidthUNIT);
        activeHeightUNIT = Math.round(activeHeightPX / unitPX);
    }

    // Guard against invalid values during initial layout/resize transitions.
    unitPX = Number.isFinite(unitPX) && unitPX > 0 ? unitPX : 1;
    return {
        unitPX: unitPX,
        activeViewPX: { x: activeWidthPX, y: activeHeightPX },
        activeViewUNIT: {x: activeWidthUNIT, y: activeHeightUNIT},
    };
}

export function getZoomInfo (chart) {
  const opt = chart.getOption();
  const dzX = opt.dataZoom?.[0] || {};
  const dzY = opt.dataZoom?.[1] || {};

  // Prefer value window if present
  const xStart = dzX.startValue ?? dzX.start;
  const xEnd = dzX.endValue ?? dzX.end;
  const yStart = dzY.startValue ?? dzY.start;
  const yEnd = dzY.endValue ?? dzY.end;

  return { xStart, xEnd, yStart, yEnd };
};

export function getUnitPX (chart, activeXPX) {
    const { xStart, xEnd } = getZoomInfo(chart); //, yStart, yEnd
    const activeWidthUNIT = xEnd - xStart;
    if (!Number.isFinite(activeWidthUNIT) || activeWidthUNIT <= 0) return null;
    // console.log('activeXPX:', activeXPX, 'activeWidthUNIT:', activeWidthUNIT, );
    
    return activeXPX / activeWidthUNIT;
}