// MASTER
export function getFormattedCoordData(heads, roomDims, center = [0, 0]) {

  const coords = getCoordinates(heads, roomDims, center);
  const data = formatCoord(coords);

  return data;
}

// Populate Room
export function getCoordinates(heads, roomDims, center = [0, 0]) {

  const coordinates = [];
  let forcedFit = 0;
  const { x: width, y: depth } = roomDims;
  // console.log(width, length);
  const absMinAreaPerHead = 0.1;
  const absMaxCacpacity = Math.floor((width * depth) / absMinAreaPerHead);
  const excess = Math.max(0, heads - absMaxCacpacity);

  const distLevels = [1.2, 0.8, 0.4, 0.1];
  // const personArea = Math.max((width * length) / heads, absMinAreaPerHead);
  // let targetDist = Math.sqrt(personArea);
  // for (let i = 0; i < 4; i++) {
  //   if (targetDist >= Math.sqrt(absMinAreaPerHead)) {
  //     distLevels.push(targetDist);
  //     targetDist -= 0.4;
  //   } else { break; }
  // } // [1.2, 0.8, 0.4, ...]

  // console.log('distLevels', distLevels, targetDist);
  // Loop through each head and try to find a non-colliding location
  const maxAttempts = 20;
  for (let i = 0; i < (heads - excess); i++) {
    let compromiseLevel = 0;
    let coordinateFound = false;

    while (compromiseLevel < distLevels.length - 1) {
      coordinateFound = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const minDist = distLevels[compromiseLevel];
        const x = Math.random() * (width - minDist) + minDist / 2 - width * 0.5;
        const y = Math.random() * (depth - minDist) + minDist / 2 - depth * 0.5;
        // console.log(x,y, minDist);

        let collision = false;
        for (const [px, py] of coordinates) {
          if (Math.hypot(px - x, py - y) < distLevels[compromiseLevel]) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          coordinates.push([x, y]);
          coordinateFound = true;
          break;
        } else if (attempt === maxAttempts - 1) {
          compromiseLevel += 1;
          continue;
        }
      }

      if (coordinateFound) {
        break;
      }
    }

    if (!coordinateFound) {
      // Person can't fit but randomly assigned a location anyways
      forcedFit += 1;
      const minDist = distLevels[distLevels.length - 1];
      const x = Math.random() * (width - minDist) + minDist / 2 - width * 0.5;
      const y = Math.random() * (depth - minDist) + minDist / 2 - depth * 0.5;
      coordinates.push([x, y]);
    }
  }

  // Scatter Excess People (<0.1 m2) Rnadomly
  for (let i = 0; i < excess; i++) {
    let x = Math.random() * (width - distLevels[0]) + distLevels[0] / 2 - width * 0.5;
    let y = Math.random() * (depth - distLevels[0]) + distLevels[0] / 2 - depth * 0.5;
    coordinates.push([x, y]);
  }

  // console.log(`Warning: ${forcedFit + excess} people can not fit.`);

  // Adjust coordinates based on room center
  for (let i = 0; i < coordinates.length; i++) {
    coordinates[i][0] += center[0];
    coordinates[i][1] += center[1];
  }

  return coordinates;
}

// Adjust Coordinates
export function formatCoord(coordinates) {
  return coordinates.map(([x, y]) => ({
      value: [x, y],
      symbolRotate: Math.random() * 360
  }))}