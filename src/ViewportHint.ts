import * as GeoJSON from 'geojson'
import distance from '@turf/distance'

/**
 * Pre-computed viewport positioning data stored on every feature's properties.
 * Camera space: Y axis points uphill (along bearing), X axis points screen-right.
 * Metric values are in that rotated frame with elevation-adjusted Y positions
 * (at 45° pitch, Δe metres above mean elevation shifts Y by Δe metres).
 */
export type ViewportHint = {
  /** Geographic centre of the rotated bounding box as [lng, lat]. */
  center: [number, number]

  /**
   * Uphill bearing in degrees clockwise from north. null when elevation variation is
   * insufficient to determine orientation — client should use top-down view (pitch 0, bearing 0).
   */
  bearing: number | null

  /** Bounding box width along the camera X axis, in metres. */
  rotatedWidthMeters: number

  /** Bounding box height along the camera Y axis, in metres (elevation-adjusted). */
  rotatedHeightMeters: number

  /**
   * Most-downhill edge of the elevation-adjusted bounding box in camera-Y metres, relative
   * to mean feature elevation. Used to compute the perspective centre shift at 45° pitch:
   * look-at point = minCameraY + nearFraction * rotatedHeightMeters, where
   * nearFraction = nearGround / (nearGround + farGround) from camera pitch and vFOV.
   */
  minCameraY: number
}

/**
 * Computes a ViewportHint from one or more GeoJSON geometries.
 * All geometry types are accepted; elevation is read from the Z coordinate (defaults to 0).
 * Throws if no coordinates are found.
 */
export function computeViewportHint(
  geometries: GeoJSON.Geometry[],
): ViewportHint {
  // Collect all coordinates (for bbox + elevation stats) and consecutive segment pairs
  // (for the downhill bearing calculation).
  const allCoords: [number, number, number][] = []
  const bearingSegments: [[number, number, number], [number, number, number]][] =
    []

  for (const geom of geometries) {
    collectGeometry(geom, allCoords, bearingSegments)
  }

  if (allCoords.length === 0) throw new Error('computeViewportHint: no coordinates found in provided geometries')

  let minLng = Infinity,
    maxLng = -Infinity
  let minLat = Infinity,
    maxLat = -Infinity
  for (const [lng, lat] of allCoords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  const centerLng = (minLng + maxLng) / 2
  const centerLat = (minLat + maxLat) / 2

  // Weight each segment's downhill direction by length to find dominant bearing.
  let sumSin = 0,
    sumCos = 0
  for (const [[lng0, lat0, elev0], [lng1, lat1, elev1]] of bearingSegments) {
    if (elev0 === elev1) continue
    const [fromLng, fromLat, toLng, toLat] =
      elev0 > elev1
        ? [lng0, lat0, lng1, lat1]
        : [lng1, lat1, lng0, lat0]
    const bear = greatCircleBearing(fromLat, fromLng, toLat, toLng)
    const len = distance([lng0, lat0], [lng1, lat1], { units: 'meters' })
    const bearingRad = (bear * Math.PI) / 180
    sumSin += Math.sin(bearingRad) * len
    sumCos += Math.cos(bearingRad) * len
  }

  // Uphill bearing = downhill + 180°; null if no elevation variation found.
  let mapBearing: number | null = null
  if (sumSin !== 0 || sumCos !== 0) {
    const dominantDownhill = (Math.atan2(sumSin, sumCos) * 180) / Math.PI
    const normalizedDownhill = ((dominantDownhill % 360) + 360) % 360
    mapBearing = (normalizedDownhill + 180) % 360
  }

  const metersPerDeg = 111320
  const cosLat = Math.cos(centerLat * (Math.PI / 180))
  const bearingRad = ((mapBearing ?? 0) * Math.PI) / 180

  let elevationSum = 0
  for (const [, , elev] of allCoords) elevationSum += elev
  const meanElevation = elevationSum / allCoords.length

  let minCameraX = Infinity,
    maxCameraX = -Infinity
  let minCameraY = Infinity,
    maxCameraY = -Infinity

  for (const [lng, lat, elev] of allCoords) {
    const dx = (lng - centerLng) * cosLat * metersPerDeg
    const dy = (lat - centerLat) * metersPerDeg
    const cx = dx * Math.cos(bearingRad) - dy * Math.sin(bearingRad)
    const cy = dx * Math.sin(bearingRad) + dy * Math.cos(bearingRad)
    // At 45° pitch, elevation above mean shifts apparent Y by the same amount (tan 45° = 1).
    const cyEffective = cy + (elev - meanElevation)
    if (cx < minCameraX) minCameraX = cx
    if (cx > maxCameraX) maxCameraX = cx
    if (cyEffective < minCameraY) minCameraY = cyEffective
    if (cyEffective > maxCameraY) maxCameraY = cyEffective
  }

  return {
    center: [centerLng, centerLat],
    bearing: mapBearing,
    rotatedWidthMeters: maxCameraX - minCameraX,
    rotatedHeightMeters: maxCameraY - minCameraY,
    minCameraY,
  }
}

/** Recursively extracts coordinates and segment pairs from a geometry. */
function collectGeometry(
  geom: GeoJSON.Geometry,
  allCoords: [number, number, number][],
  bearingSegments: [[number, number, number], [number, number, number]][],
): void {
  switch (geom.type) {
    case 'Point': {
      const [lng, lat, elev = 0] = geom.coordinates
      allCoords.push([lng, lat, elev])
      break
    }
    case 'MultiPoint': {
      for (const pos of geom.coordinates) {
        const [lng, lat, elev = 0] = pos
        allCoords.push([lng, lat, elev])
      }
      break
    }
    case 'LineString':
      collectPositions(geom.coordinates, allCoords, bearingSegments)
      break
    case 'MultiLineString':
      for (const line of geom.coordinates) {
        collectPositions(line, allCoords, bearingSegments)
      }
      break
    case 'Polygon':
      for (const ring of geom.coordinates) {
        collectPositions(ring, allCoords, bearingSegments)
      }
      break
    case 'MultiPolygon':
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) {
          collectPositions(ring, allCoords, bearingSegments)
        }
      }
      break
    case 'GeometryCollection':
      for (const g of geom.geometries) {
        collectGeometry(g, allCoords, bearingSegments)
      }
      break
  }
}

/** Adds positions to allCoords and consecutive pairs to bearingSegments. Z defaults to 0. */
function collectPositions(
  positions: GeoJSON.Position[],
  allCoords: [number, number, number][],
  bearingSegments: [[number, number, number], [number, number, number]][],
): void {
  const elevated: [number, number, number][] = positions.map(
    ([lng, lat, elev = 0]) => [lng, lat, elev],
  )
  for (const coord of elevated) allCoords.push(coord)
  for (let i = 0; i < elevated.length - 1; i++) {
    bearingSegments.push([elevated[i], elevated[i + 1]])
  }
}

/** Great-circle bearing from (lat1, lng1) to (lat2, lng2), in degrees 0–360. */
function greatCircleBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lng2 - lng1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}
