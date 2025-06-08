/**
 * Historical snow cover information for a geometry.
 * Data is organized chronologically, with the oldest year first.
 * 
 * @property {number} year - The year for this data
 * @property {Array<[number, number, number]>} days - Daily measurements as tuples of [day of year, NDSI snow cover value, % of valid pixels]
 */
export type SnowCoverHistory = {
  year: number
  /**
   * Array of daily snow cover measurements ordered chronologically by day of year.
   * Each tuple contains:
   * - Day of year (1-365/366)
   * - NDSI snow cover value (0-100) - measures snow presence, not depth
   * - Percentage of valid pixels (0-100) - pixels with valid data for that day
   * 
   * Data source: VIIRS/NPP CGF Snow Cover Daily L3 Global 375m product (VNP10A1F)
   * Resolution: 375m (affects measurement accuracy for small geometries)
   * Frequency: Weekly under cloud-free conditions, varies in practice
   * 
   * Valid pixel percentage may be less than 100% due to:
   * - Cloud cover
   * - Different cloud gap filling dates for pixels
   * - Incomplete pipeline data
   */
  days: [number, number, number][]
}[]

/**
 * Monthly aggregated snow cover history.
 * Data is organized chronologically, with the oldest year first.
 * 
 * @property {number} year - The year for this data
 * @property {Array<[number, number, number]>} months - Monthly aggregations as tuples of [month, average snow cover, average valid pixels]
 */
export type MonthlySnowCoverHistory = {
  year: number
  /**
   * Array of monthly snow cover aggregations ordered chronologically by month.
   * Each tuple contains:
   * - Month (1-12)
   * - Average NDSI snow cover value (0-100) - weighted by valid pixels
   * - Average percentage of valid pixels (0-100) - across all days in month
   */
  months: [number, number, number][]
}[]

/**
 * Converts daily snow cover measurements to monthly aggregations.
 * 
 * Snow cover values are weighted by valid pixel percentages when calculating monthly averages.
 * Input data is assumed to be sorted chronologically.
 * 
 * @param snowCoverHistory Daily snow cover history to aggregate
 * @returns Monthly aggregated snow cover history
 */
export function getMonthlySnowCover(
  snowCoverHistory: SnowCoverHistory
): MonthlySnowCoverHistory {
  return snowCoverHistory.map(yearData => {
    const monthlyData = new Map<number, { values: number[], validPixels: number[], count: number }>()
    
    // Group daily data by month
    yearData.days.forEach(([dayOfYear, snowCover, validPixelPercent]) => {
      const date = dayOfYearToDate(yearData.year, dayOfYear)
      const month = date.getMonth() + 1 // Convert to 1-12
      
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { values: [], validPixels: [], count: 0 })
      }
      
      const monthData = monthlyData.get(month)!
      monthData.values.push(snowCover * validPixelPercent / 100) // Weight by valid pixels
      monthData.validPixels.push(validPixelPercent)
      monthData.count++
    })
    
    // Calculate monthly averages
    const months: [number, number, number][] = []
    monthlyData.forEach((data, month) => {
      const totalValidPixels = data.validPixels.reduce((sum, val) => sum + val, 0)
      const weightedSnowCover = data.values.reduce((sum, val) => sum + val, 0)
      const avgValidPixels = totalValidPixels / data.count
      const avgSnowCover = avgValidPixels > 0 ? (weightedSnowCover / totalValidPixels) * 100 : 0
      
      months.push([month, Math.round(avgSnowCover * 100) / 100, Math.round(avgValidPixels * 100) / 100])
    })
    
    return {
      year: yearData.year,
      months
    }
  })
}

/**
 * Converts day of year to a Date object.
 * 
 * @param year The year
 * @param dayOfYear Day of year (1-365/366)
 * @returns Date object for the specified day
 */
function dayOfYearToDate(year: number, dayOfYear: number): Date {
  const date = new Date(year, 0, 1)
  date.setDate(dayOfYear)
  return date
}