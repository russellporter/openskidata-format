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
  averagePitchInPercent: number
  maxPitchInPercent: number
  inclinedLengthInMeters: number
  overallPitchInPercent: number
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

export function getPitchData(profileGeometry: GeoJSON.LineString): PitchData {
  const coordinates = profileGeometry.coordinates
  if (coordinates[0].length < 3) {
    throw 'Elevation data is required for slope analysis'
  }

  let totalLength = 0
  let totalInclinedLength = 0
  let totalElevationChange = 0
  let maxUphillPitch = Number.MIN_VALUE
  let maxDownhillPitch = Number.MAX_VALUE
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

    const percentSlope = elevation / lengthInMeters
    maxUphillPitch = Math.max(maxUphillPitch, percentSlope)
    maxDownhillPitch = Math.min(maxDownhillPitch, percentSlope)

    totalLength += lengthInMeters
    totalInclinedLength += Math.sqrt(
      Math.pow(lengthInMeters, 2) + Math.pow(elevation, 2),
    )
    totalElevationChange += Math.abs(elevation)
  }

  const maxPitch =
    Math.abs(maxUphillPitch) > Math.abs(maxDownhillPitch)
      ? maxUphillPitch
      : maxDownhillPitch
  const averagePitch = totalElevationChange / totalLength
  const overallElevationChange = Math.abs(
    coordinates[coordinates.length - 1][2] - coordinates[0][2],
  )
  return {
    averagePitchInPercent: averagePitch,
    maxPitchInPercent: maxPitch,
    inclinedLengthInMeters: totalInclinedLength,
    overallPitchInPercent: overallElevationChange / totalLength,
  }
}

export function getProfileGeometry(
  geometry: GeoJSON.LineString,
  elevationProfile: ElevationProfile,
): GeoJSON.LineString {
  const geometries = lineChunksForElevationProfile(
    geometry,
    elevationProfile.resolution,
  )
  var index = 0
  for (let subline of geometries) {
    const firstPoint = subline.coordinates[0]
    if (firstPoint.length === 2) {
      firstPoint.push(elevationProfile.heights[index])
    }

    index++

    if (index === elevationProfile.heights.length) {
      throw 'Mismatch of points & elevation profile.'
    }

    const lastPoint = subline.coordinates[subline.coordinates.length - 1]
    if (lastPoint.length === 2) {
      lastPoint.push(elevationProfile.heights[index])
    }
  }

  if (index !== elevationProfile.heights.length - 1) {
    throw `Mismatch of points & elevation profile`
  }

  // Check all coordinates have a height
  for (let subline of geometries) {
    for (let point of subline.coordinates) {
      if (point.length < 3) {
        throw 'All points should have an elevation at this point.'
      }
    }
  }

  return {
    type: 'LineString',
    coordinates: geometries.flatMap((geometry) => geometry.coordinates),
  }
}

/**
 * Determines the points to use for an elevation profile.
 */
export function extractPointsForElevationProfile(
  geometry: LineString,
  resolution: number,
): GeoJSON.LineString {
  const geometries = lineChunksForElevationProfile(geometry, resolution)
  const points: GeoJSON.Position[] = []
  for (let subline of geometries) {
    const point = subline.coordinates[0]
    points.push([point[0], point[1]])
  }
  if (geometries.length > 0) {
    const geometry = geometries[geometries.length - 1]
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

function lineChunksForElevationProfile(
  geometry: LineString,
  resolution: number,
): GeoJSON.LineString[] {
  return lineChunk(geometry, resolution, {
    units: 'meters',
  }).features.map((feature) => feature.geometry)
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
