import { getMonthlySnowCover, SnowCoverHistory, MonthlySnowCoverHistory } from './SnowCoverHistory'

describe('getMonthlySnowCover', () => {
  it('should process daily data into monthly averages', () => {
    const input: SnowCoverHistory = [
      {
        year: 2023,
        days: [
          [1, 80, 95],   // Jan 1
          [15, 75, 90],  // Jan 15
          [32, 60, 85],  // Feb 1
          [46, 65, 80],  // Feb 15
          [60, 40, 75],  // Mar 1
          [74, 35, 70],  // Mar 15
        ]
      }
    ]

    const result = getMonthlySnowCover(input)

    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2023)
    expect(result[0].months).toHaveLength(3)

    // January: (80*95 + 75*90) / (95 + 90) = (7600 + 6750) / 185 = 77.57
    expect(result[0].months[0][0]).toBe(1) // Month
    expect(result[0].months[0][1]).toBeCloseTo(77.57, 1) // Snow cover
    expect(result[0].months[0][2]).toBe(92.5) // Valid pixels average

    // February: (60*85 + 65*80) / (85 + 80) = (5100 + 5200) / 165 = 62.42
    expect(result[0].months[1][0]).toBe(2)
    expect(result[0].months[1][1]).toBeCloseTo(62.42, 1)
    expect(result[0].months[1][2]).toBe(82.5)

    // March: (40*75 + 35*70) / (75 + 70) = (3000 + 2450) / 145 = 37.59
    expect(result[0].months[2][0]).toBe(3)
    expect(result[0].months[2][1]).toBeCloseTo(37.59, 1)
    expect(result[0].months[2][2]).toBe(72.5)
  })

  it('should handle multiple years', () => {
    const input: SnowCoverHistory = [
      {
        year: 2022,
        days: [[1, 50, 80]]
      },
      {
        year: 2023,
        days: [[1, 60, 90]]
      }
    ]

    const result = getMonthlySnowCover(input)

    expect(result).toHaveLength(2)
    expect(result[0].year).toBe(2022)
    expect(result[1].year).toBe(2023)
  })

  it('should handle empty data', () => {
    const input: SnowCoverHistory = []
    const result = getMonthlySnowCover(input)
    expect(result).toEqual([])
  })

  it('should handle zero valid pixels gracefully', () => {
    const input: SnowCoverHistory = [
      {
        year: 2023,
        days: [
          [1, 80, 0],   // No valid pixels
          [15, 75, 100] // Full valid pixels
        ]
      }
    ]

    const result = getMonthlySnowCover(input)

    expect(result[0].months[0][0]).toBe(1)
    expect(result[0].months[0][1]).toBe(75) // Only the second day contributes
    expect(result[0].months[0][2]).toBe(50) // Average of 0 and 100
  })

  it('should handle data across multiple months', () => {
    const input: SnowCoverHistory = [
      {
        year: 2023,
        days: [
          [1, 80, 90],   // January
          [100, 40, 70], // April (day 100)
          [335, 50, 80]  // December (day 335)
        ]
      }
    ]

    const result = getMonthlySnowCover(input)

    expect(result[0].months).toHaveLength(3)
    expect(result[0].months[0][0]).toBe(1)  // January
    expect(result[0].months[1][0]).toBe(4)  // April  
    expect(result[0].months[2][0]).toBe(12) // December
  })
})