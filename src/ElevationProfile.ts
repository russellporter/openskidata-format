import distance from '@turf/distance'
import length from '@turf/length'
import { lineChunk } from '@turf/line-chunk'
import { LineString } from 'geojson'

/**
 * Represents an elevation profile with height measurements along a LineString.
 *
 * @property {number[]} heights - Array of height measurements in meters. These heights are sampled at regular intervals along the LineString,
 * except for the final height which corresponds to the LineString endpoint and may have a different spacing.
 * Height values can be mapped to geographical coordinates using Turf.js: `turf.lineChunk(geometry, resolution, {units: 'meters'})`.
 * @property {number} resolution - The horizontal sampling distance in meters between consecutive height measurements.
 */
export type ElevationProfile = {
  heights: number[]
  resolution: number
}

/**
 * Elevation data that can be computed on demand fom a Run or Lift feature.
 */
export type ElevationData = AscentDescentData &
  PitchData & {
    profileGeometry: GeoJSON.LineString
  }

type AscentDescentData = {
  ascentInMeters: number
  descentInMeters: number
  minElevationInMeters: number
  maxElevationInMeters: number
  verticalInMeters: number
}

type PitchData = {
  averagePitchInPercent: number | null
  maxPitchInPercent: number | null
  inclinedLengthInMeters: number
  overallPitchInPercent: number | null
}

export function getElevationData(
  profileGeometry: GeoJSON.LineString,
): ElevationData {
  return {
    ...getAscentAndDescent(profileGeometry),
    ...getPitchData(profileGeometry),
    profileGeometry,
  }
}

export function getPitchData(
  profileGeometry: GeoJSON.LineString,
  resolutionInMeters: number = 25, // Default resolution of 25 meters for pitch calculation
): PitchData {
  const coordinates = profileGeometry.coordinates
  if (coordinates[0].length < 3) {
    throw 'Elevation data is required for slope analysis'
  }

  // For overall calculations (average pitch, total length, etc.)
  let totalLength = 0
  let totalInclinedLength = 0
  let totalElevationChange = 0

  // First calculate the values needed for overall statistics
  for (let i = 0; i < coordinates.length - 1; i++) {
    const before = coordinates[i]
    const after = coordinates[i + 1]
    const elevation = after[2] - before[2]
    const geometry: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: [before, after],
    }
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry,
      properties: {},
    }
    const lengthInMeters = length(feature, { units: 'meters' })

    totalLength += lengthInMeters
    totalInclinedLength += Math.sqrt(
      Math.pow(lengthInMeters, 2) + Math.pow(elevation, 2),
    )
    totalElevationChange += Math.abs(elevation)
  }

  // Chunk the line into fixed-length segments for max pitch calculation
  const chunkedGeometries = lineChunk(profileGeometry, resolutionInMeters, {
    units: 'meters',
  }).features.map((feature) => feature.geometry)

  // turf 7.3+ adds Z coordinates to newly created points using segment-end elevation,
  // but we need distance-based interpolation. Strip Z from non-original vertices so
  // interpolateElevation can add them correctly.
  // https://github.com/Turfjs/turf/issues/3007
  stripNonOriginalElevations(chunkedGeometries, coordinates)

  // Mutates the geometries in place to add elevation data
  interpolateElevation(chunkedGeometries)

  // Initialize max pitch values
  let maxPitchValue: number | null = null

  // Calculate max pitch over the fixed-length chunks
  for (const chunk of chunkedGeometries) {
    const chunkCoords = chunk.coordinates

    const startPoint = chunkCoords[0]
    const endPoint = chunkCoords[chunkCoords.length - 1]

    const elevationChange = endPoint[2] - startPoint[2]
    const chunkLengthInMeters = length(
      { type: 'Feature', geometry: chunk, properties: {} },
      { units: 'meters' },
    )

    // Skip chunks that are too close together to calculate pitch reliably (can happen for the last chunk)
    if (chunkLengthInMeters < resolutionInMeters / 2) continue

    const chunkPitch = Math.abs(elevationChange / chunkLengthInMeters)
    if (maxPitchValue === null || chunkPitch > maxPitchValue) {
      maxPitchValue = chunkPitch
    }
  }

  const averagePitch = totalElevationChange / totalLength
  const overallElevationChange = Math.abs(
    coordinates[coordinates.length - 1][2] - coordinates[0][2],
  )

  // null maxPitchValue indicates the line is shorter than half the resolution, in which case the accuracy of pitch calculations
  // is questionable as a 1m change in elevation over
  // 1m of distance would be a 45 degree slope, this can happen due to resolution of the elevation data.
  if (maxPitchValue === null) {
    return {
      averagePitchInPercent: null,
      maxPitchInPercent: null,
      inclinedLengthInMeters: totalInclinedLength,
      overallPitchInPercent: null,
    }
  }

  return {
    averagePitchInPercent: averagePitch,
    maxPitchInPercent: maxPitchValue,
    inclinedLengthInMeters: totalInclinedLength,
    overallPitchInPercent: overallElevationChange / totalLength,
  }
}

export function getProfileGeometry(
  geometry: GeoJSON.LineString,
  elevationProfile: ElevationProfile,
): GeoJSON.LineString {
  const profileLine = extractPointsForElevationProfile(
    geometry,
    elevationProfile.resolution,
  )
  if (profileLine.coordinates.length !== elevationProfile.heights.length) {
    throw `Mismatch of points & elevation profile`
  }

  for (let i = 0; i < profileLine.coordinates.length; i++) {
    const point = profileLine.coordinates[i]
    const height = elevationProfile.heights[i]
    point.push(height)
  }

  return profileLine
}

/**
 * Determines the points to use for an elevation profile.
 */
export function extractPointsForElevationProfile(
  geometry: LineString,
  resolution: number,
): GeoJSON.LineString {
  // Important: Z coordinates in the output of lineChunk may be incorrect, ignore them (https://github.com/Turfjs/turf/issues/3007)
  const lineChunks = lineChunk(geometry, resolution, {
    units: 'meters',
  }).features.map((feature) => feature.geometry)

  const points: GeoJSON.Position[] = []
  for (let subline of lineChunks) {
    const point = subline.coordinates[0]
    points.push([point[0], point[1]])
  }
  if (lineChunks.length > 0) {
    const geometry = lineChunks[lineChunks.length - 1]
    const coords = geometry.coordinates
    if (coords.length > 1) {
      const point = coords[coords.length - 1]
      points.push([point[0], point[1]])
    }
  }

  return {
    type: 'LineString',
    coordinates: points,
  }
}

export function getAscentAndDescent(
  profileGeometry: GeoJSON.LineString,
): AscentDescentData {
  const coordinates = profileGeometry.coordinates
  if (coordinates.length === 0) {
    throw 'Empty coordinates are not supported for elevation data analysis'
  }
  if (coordinates[0].length < 3) {
    throw 'Elevation data is required for elevation data analysis'
  }
  const initialElevation = coordinates[0][2]
  const result = coordinates
    .map((point) => point[2])
    .reduce(
      (accumulated, currentElevation) => {
        const ascent = currentElevation - accumulated.lastElevation
        if (ascent > 0) {
          accumulated.ascent += ascent
        } else {
          accumulated.descent -= ascent
        }
        accumulated.lastElevation = currentElevation
        accumulated.minElevation = Math.min(
          currentElevation,
          accumulated.minElevation,
        )
        accumulated.maxElevation = Math.max(
          currentElevation,
          accumulated.maxElevation,
        )

        return accumulated
      },
      {
        ascent: 0,
        descent: 0,
        minElevation: initialElevation,
        maxElevation: initialElevation,
        lastElevation: initialElevation,
      },
    )

  return {
    ascentInMeters: result.ascent,
    descentInMeters: result.descent,
    minElevationInMeters: result.minElevation,
    maxElevationInMeters: result.maxElevation,
    verticalInMeters: result.maxElevation - result.minElevation,
  }
}

/**
 * Strip Z coordinates from points that were created by lineChunk (not original vertices).
 * Original vertices are identified by matching lon/lat coordinates.
 * Mutates the geometries in place.
 */
function stripNonOriginalElevations(
  geometries: GeoJSON.LineString[],
  originalCoordinates: GeoJSON.Position[],
) {
  const originalSet = new Set(originalCoordinates.map((c) => `${c[0]},${c[1]}`))

  for (const geometry of geometries) {
    for (const point of geometry.coordinates) {
      const key = `${point[0]},${point[1]}`
      if (!originalSet.has(key) && point.length >= 3) {
        point.length = 2
      }
    }
  }
}

/**
 * Interpolate elevation for points along a list of linestrings that don't already have elevation.
 * Uses geographic distances for proper interpolation.
 * Mutates the geometries in place.
 *
 * @throws Error if no points have elevation data or if segments can't be properly formed
 */
function interpolateElevation(geometries: GeoJSON.LineString[]) {
  if (geometries.length === 0) {
    return
  }

  // Flatten all coordinates into a single array for easier processing
  const allPoints: {
    point: GeoJSON.Position
    hasElevation: boolean
    index: number
    distanceFromStart: number // Distance from the beginning of the line
  }[] = []

  // Collect all points while tracking which ones have elevation
  let pointIndex = 0
  let totalDistance = 0
  let previousPoint: GeoJSON.Position | null = null

  for (const geometry of geometries) {
    for (const point of geometry.coordinates) {
      // Calculate distance from previous point
      if (previousPoint) {
        const segmentLength = distance(previousPoint, point, {
          units: 'meters',
        })
        totalDistance += segmentLength
      }

      const hasElevation = point.length >= 3
      allPoints.push({
        point,
        hasElevation,
        index: pointIndex++,
        distanceFromStart: totalDistance,
      })

      previousPoint = point
    }
  }

  // Find elevation reference points
  const referencePoints = allPoints.filter((p) => p.hasElevation)

  if (referencePoints.length <= 1) {
    throw 'At least two points with elevation data are required'
  }

  // Process segments between each pair of reference points
  for (let i = 0; i < referencePoints.length - 1; i++) {
    const startPoint = referencePoints[i]
    const endPoint = referencePoints[i + 1]

    // Points must be in sequence
    if (endPoint.index <= startPoint.index) {
      throw 'Reference points must be in sequence'
    }

    const startElevation = startPoint.point[2]
    const endElevation = endPoint.point[2]
    const elevationDelta = endElevation - startElevation

    // Calculate the geographic distance between reference points
    const distanceBetweenRefs =
      endPoint.distanceFromStart - startPoint.distanceFromStart

    // Interpolate elevations for points between references
    for (let j = startPoint.index + 1; j < endPoint.index; j++) {
      const pointData = allPoints[j]

      // Only interpolate if point doesn't already have elevation
      if (pointData.hasElevation) {
        throw "Can't interpolate elevation for points that already have it"
      }
      // Calculate how far along this point is between the reference points
      const distanceFromStart =
        pointData.distanceFromStart - startPoint.distanceFromStart

      // Its possible both references are the same point, in which case we use the ref elevation
      let interpolatedElevation = startElevation
      if (distanceBetweenRefs > 0) {
        const interpolationFactor = distanceFromStart / distanceBetweenRefs
        interpolatedElevation =
          startElevation + elevationDelta * interpolationFactor
      }

      // Add elevation to the existing point array (using reference semantics)
      pointData.point.push(interpolatedElevation)
    }
  }
}
