/**
 * Represents an elevation profile with evenly distributed height measurements along a LineString.
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
