export interface ElevationProfile {
  // Heights are evenly distributed along the LineString with a frequency based on the resolution below.
  // The final height corresponds to the end of the LineString and will not be the same space between the previous point as the rest.
  // The corresponding coordinates can be computed from the original geometry using Turf.js: `turf.lineChunk(geometry, resolution, {units: 'meters'});`
  heights: number[]
  // Horizontal resolution in meters of the profile
  resolution: number
}
