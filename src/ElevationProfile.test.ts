import length from '@turf/length'
import {
  extractPointsForElevationProfile,
  getAscentAndDescent,
  getPitchData,
  lineChunkPatched,
} from './ElevationProfile'
import { FeatureType } from './FeatureType'
import { getLiftElevationData, LiftFeature, LiftType } from './Lift'
import { getRunElevationData, RunDifficulty, RunFeature, RunUse } from './Run'
import { RunDifficultyConvention } from './RunDifficultyConvention'
import { Status } from './Status'

describe('ElevationProfile', () => {
  describe('getAscentAndDescent', () => {
    it('calculates ascent and descent correctly from elevation profile', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100], // start at 100m
          [1, 0, 150], // climb to 150m (+50m)
          [2, 0, 130], // descend to 130m (-20m)
          [3, 0, 180], // climb to 180m (+50m)
        ],
      }

      const result = getAscentAndDescent(profileGeometry)

      expect(result.ascentInMeters).toBe(100) // 50 + 50 = 100m of climbing
      expect(result.descentInMeters).toBe(20) // 20m of descent
      expect(result.minElevationInMeters).toBe(100)
      expect(result.maxElevationInMeters).toBe(180)
    })

    it('throws error when coordinates are empty', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [],
      }

      expect(() => getAscentAndDescent(profileGeometry)).toThrow(
        'Empty coordinates are not supported for elevation data analysis',
      )
    })

    it('throws error when elevation data is missing', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(() => getAscentAndDescent(profileGeometry)).toThrow(
        'Elevation data is required for elevation data analysis',
      )
    })
  })

  describe('getPitchData', () => {
    it('calculates pitch data correctly', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.177425600412874, 47.31265682344346, 100], // start
          [11.177224899122194, 47.312533118812354, 110], // 10m rise over ~20.45m distance = ~49% slope / 22.76m inclined
          [11.176823496540862, 47.31229807921545, 105], // -5m fall over ~39.99m distance = ~-13% slope / 40.3m inclined
        ],
      }

      const result = getPitchData(profileGeometry)

      // With the new resolution calculation, the actual resolution divides the distance evenly
      // Total length is ~60.44m, with default resolution of 25m: numSegments = ceil(60.44/25) = 3, actualResolution = 60.44/3 ≈ 20.14m
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(20.14)
      expect(result.pitchCalculationResolutionInMeters).toBeLessThanOrEqual(25)
      expect(result.maxPitchInPercent).toBeCloseTo(0.489)
      expect(result.averagePitchInPercent).toBeCloseTo(0.2482)
      expect(result.inclinedLengthInMeters).toBeCloseTo(63.0597)
    })

    it('calculates pitch correctly on a profile with problematic short segments', () => {
      // Create a geometry with artificially short segments and unrealistic elevation changes
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.00000001, 101], // Very short distance with 1m elevation gain (unrealistically steep)
          [0, 0.001, 102], // Normal segment
          [0, 0.002, 103], // Normal segment
        ],
      }

      // Using fixed-length segments should smooth out the unrealistic spike
      const result = getPitchData(profileGeometry, 50)

      // The overall change should be more reasonable when calculated over fixed distances
      expect(result.maxPitchInPercent).toBeLessThan(0.5) // Should be much less than the individual segment pitch
    })

    it('calculates resolution that divides distance evenly', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.001, 110], // ~111m distance
          [0, 0.002, 105], // ~111m distance
        ],
      }

      const result = getPitchData(profileGeometry, 50)

      // Resolution should be <= 50
      expect(result.pitchCalculationResolutionInMeters).toBeLessThanOrEqual(50)

      // With ~222m total length and 50m input resolution:
      // numSegments = ceil(222/50) = 5
      // actualResolution = 222/5 ≈ 44.48m
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(44.48)
    })

    it('uses total length as resolution when line is shorter than input resolution', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.0001, 110], // ~11m distance
        ],
      }

      const result = getPitchData(profileGeometry, 50)

      // Resolution should equal the total length since numSegments = ceil(11/50) = 1
      // actualResolution = 11/1 ≈ 11.12m
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(11.12)
      expect(result.pitchCalculationResolutionInMeters).toBeLessThanOrEqual(50)
    })

    it('ensures all chunks are processed without skipping short chunks', () => {
      // Create a line that would previously have a short final chunk
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.177425600412874, 47.31265682344346, 100],
          [11.177224899122194, 47.312533118812354, 120], // ~20m, steep
          [11.176823496540862, 47.31229807921545, 105], // ~40m, gentle descent
        ],
      }

      const result = getPitchData(profileGeometry, 25)

      // With evenly divided chunks, no chunks should be skipped
      // The max pitch should be calculated from all segments
      expect(result.maxPitchInPercent).toBeGreaterThan(0)
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(20.14)
    })

    it('returns null pitch data for very short lines', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.00001, 101], // ~1.11m distance
        ],
      }

      const result = getPitchData(profileGeometry, 25)

      // Lines shorter than half the resolution should return null pitch data
      // because elevation data resolution makes pitch calculations unreliable
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(1.11)
      expect(result.maxPitchInPercent).toBeNull()
      expect(result.averagePitchInPercent).toBeNull()
      expect(result.overallPitchInPercent).toBeNull()
      expect(result.inclinedLengthInMeters).toBeGreaterThan(0) // This should still be calculated
    })

    it('calculates pitch data for lines just above the minimum threshold', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.00015, 105], // ~16.7m distance, just above half of 25m
        ],
      }

      const result = getPitchData(profileGeometry, 25)

      // Lines at or above half the resolution should calculate pitch data
      expect(result.pitchCalculationResolutionInMeters).toBeCloseTo(16.68)
      expect(result.maxPitchInPercent).not.toBeNull()
      expect(result.averagePitchInPercent).not.toBeNull()
      expect(result.overallPitchInPercent).not.toBeNull()
    })
  })

  describe('extractPointsForElevationProfile', () => {
    it('extracts points at regular intervals', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.177452968770694, 47.312650638218656],
          [11.175409464719593, 47.31138883724759],
        ],
      } // 208m distance

      // With 20m resolution, there should be 12 points
      const result = extractPointsForElevationProfile(geometry, 20)

      expect(result.geometry.coordinates.length).toEqual(12)
      expect(result.geometry.coordinates[0]).toEqual([
        11.177452968770694, 47.312650638218656,
      ])
      expect(
        result.geometry.coordinates[result.geometry.coordinates.length - 1],
      ).toEqual([11.175409464719593, 47.31138883724759])
    })

    it('handles points that already have elevation', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.177452968770694, 47.312650638218656, 1500], // With elevation
          [11.175409464719593, 47.31138883724759, 1450], // With elevation
        ],
      }

      const result = extractPointsForElevationProfile(geometry, 20)

      // Should still work properly, returning 2D points regardless of input dimension
      expect(result.geometry.coordinates.length).toBeGreaterThan(1)
      expect(result.geometry.coordinates[0].length).toBe(2) // Should always return 2D points
      expect(result.geometry.coordinates[0]).toEqual([
        11.177452968770694, 47.312650638218656,
      ])
    })
  })

  describe('getRunElevationData', () => {
    it('returns null for non-LineString geometry', () => {
      const runFeature: RunFeature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
        properties: {
          type: FeatureType.Run,
          id: '123',
          ref: null,
          uses: [RunUse.Downhill],
          difficulty: RunDifficulty.EASY,
          status: Status.Operating,
          name: 'Test Run',
          elevationProfile: null,
          skiAreas: [],
          sources: [],
          description: null,
          difficultyConvention: RunDifficultyConvention.EUROPE,
          oneway: null,
          lit: null,
          gladed: null,
          patrolled: null,
          snowmaking: null,
          snowfarming: null,
          grooming: null,
          websites: [],
          wikidataID: null,
          places: [],
        },
      }

      expect(getRunElevationData(runFeature)).toBeNull()
    })

    it('returns null for missing elevation profile', () => {
      const runFeature: RunFeature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0, 0],
            [1, 1, 0],
          ],
        },
        properties: {
          type: FeatureType.Run,
          id: '123',
          difficulty: RunDifficulty.EASY,
          status: Status.Operating,
          name: 'Test Run',
          elevationProfile: null,
          skiAreas: [],
          sources: [],
          uses: [],
          ref: null,
          description: null,
          difficultyConvention: RunDifficultyConvention.EUROPE,
          oneway: null,
          lit: null,
          gladed: null,
          patrolled: null,
          snowmaking: null,
          snowfarming: null,
          grooming: null,
          websites: [],
          wikidataID: null,
          places: [],
        },
      }

      expect(getRunElevationData(runFeature)).toBeNull()
    })
  })

  describe('getLiftElevationData', () => {
    it('returns null for non-LineString geometry', () => {
      const liftFeature: LiftFeature = {
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 0, 100],
              [1, 1, 200],
            ],
          ],
        },
        properties: {
          type: FeatureType.Lift,
          id: '123',
          liftType: LiftType.ChairLift,
          status: Status.Operating,
          access: null,
          name: 'Test Lift',
          skiAreas: [],
          sources: [],
          ref: null,
          refFRCAIRN: null,
          description: null,
          oneway: null,
          occupancy: null,
          capacity: null,
          duration: null,
          detachable: null,
          bubble: null,
          heating: null,
          stations: [],
          websites: [],
          wikidataID: null,
          places: [],
        },
      }

      expect(getLiftElevationData(liftFeature)).toBeNull()
    })

    it('get max aspect', () => {
      const runFeature = {
        type: 'Feature',
        properties: {
          type: 'run',
          id: 'c8c91edb337438a2cc8b96f3e3cc42887384de3b',
          uses: ['nordic'],
          name: 'City-Trail Davos',
          ref: '3',
          description: 'Golfplatz – Bünda',
          difficulty: 'novice',
          difficultyConvention: 'europe',
          status: 'operating',
          oneway: false,
          lit: null,
          gladed: null,
          patrolled: null,
          snowmaking: null,
          snowfarming: null,
          grooming: 'classic+skating',
          skiAreas: [],
          elevationProfile: {
            heights: [
              1546, 1546, 1546, 1546, 1546, 1545, 1546, 1546, 1546, 1546, 1546,
              1545, 1544, 1543, 1543, 1543, 1543, 1543, 1543, 1543, 1544, 1544,
              1545, 1546, 1547, 1547, 1547, 1547, 1547, 1547, 1547, 1547, 1547,
              1547, 1547, 1547, 1547, 1547, 1548, 1549, 1549, 1549, 1549, 1549,
              1550, 1550, 1551, 1552, 1552, 1552, 1552, 1552, 1552, 1552, 1553,
              1554, 1554, 1554, 1555, 1556, 1557, 1557, 1557, 1557, 1558, 1560,
              1563, 1564, 1567, 1569, 1570, 1570, 1572, 1572, 1571, 1570, 1572,
              1574, 1572, 1571, 1571, 1572, 1572, 1573, 1574, 1573, 1572, 1572,
              1573, 1575, 1576, 1577, 1580, 1583, 1584, 1586,
            ],
            resolution: 24.737575778032642,
            targetResolution: 25,
          },
          sources: [],
          websites: [],
          wikidataID: null,
          places: [],
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [9.8353072, 46.797782200000015, 1546],
            [9.8353827, 46.797835800000016, 1546],
            [9.8356987, 46.798060000000014, 1546],
            [9.8360226, 46.79806910000001, 1546],
            [9.8380422, 46.79899450000001, 1546],
            [9.837935, 46.79945900000001, 1544],
            [9.8376614, 46.79963530000002, 1543],
            [9.8372698, 46.7996886, 1543],
            [9.8370767, 46.79981160000001, 1543],
            [9.8370096, 46.79993550000002, 1544],
            [9.8371799, 46.8000539, 1543],
            [9.837685500000003, 46.8002724, 1543],
            [9.8379698, 46.8005066, 1543],
            [9.8380396, 46.8006763, 1544],
            [9.8379765, 46.8008132, 1544],
            [9.837833, 46.80095, 1545],
            [9.8378196, 46.8011363, 1546],
            [9.8378488, 46.8013207, 1547],
            [9.837881, 46.8014058, 1547],
            [9.837895, 46.8014252, 1547],
            [9.8382166, 46.801688099999986, 1547],
            [9.8383936, 46.8019258, 1547],
            [9.8386216, 46.8029164, 1547],
            [9.8387771, 46.8031256, 1547],
            [9.8394209, 46.8034763, 1547],
            [9.8397186, 46.8037939, 1547],
            [9.8398018, 46.804254799999995, 1548],
            [9.8399613, 46.8044383, 1549],
            [9.8401469, 46.80448349999998, 1549],
            [9.8402551, 46.80451270000001, 1549],
            [9.8405166, 46.80462749999998, 1549],
            [9.8422614, 46.804981799999986, 1552],
            [9.842446900000004, 46.805034, 1552],
            [9.8425913, 46.805118600000014, 1552],
            [9.8426637, 46.8053545, 1552],
            [9.842754900000003, 46.80561510000001, 1552],
            [9.8429278, 46.805750300000014, 1552],
            [9.8434727, 46.80615580000001, 1553],
            [9.8437722, 46.806829199999996, 1554],
            [9.8437728, 46.807147199999996, 1555],
            [9.8442519, 46.8075484, 1557],
            [9.8446648, 46.807873199999996, 1557],
            [9.8448358, 46.80802230000001, 1557],
            [9.8453494, 46.80833250000001, 1562],
            [9.8457157, 46.808526, 1564],
            [9.8463504, 46.8087692, 1569],
            [9.8467433, 46.8090115, 1570],
            [9.8471886, 46.8092391, 1571],
            [9.8474304, 46.8093297, 1572],
            [9.847923499999998, 46.8095145, 1570],
            [9.849087, 46.80979280000001, 1573],
            [9.8495311, 46.809877599999986, 1571],
            [9.850192000000003, 46.8099654, 1572],
            [9.8513658, 46.81011090000001, 1572],
            [9.852096400000004, 46.810099599999994, 1573],
            [9.852562200000007, 46.810143499999995, 1575],
            [9.852670200000004, 46.8103734, 1576],
            [9.852746100000006, 46.8105425, 1577],
            [9.852914200000006, 46.81067139999999, 1580],
            [9.853248800000003, 46.810729599999995, 1583],
            [9.853487800000007, 46.810662799999996, 1584],
            [9.853535100000004, 46.81066409999998, 1586],
          ],
        },
      } as RunFeature

      const result = getRunElevationData(runFeature)
      expect(result?.maxPitchInPercent).toBeCloseTo(0.12)
    })
  })

  describe('lineChunkPatched', () => {
    it('chunks a line into evenly spaced segments', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.001, 110], // ~111m distance
          [0, 0.002, 105], // ~111m distance
        ],
      }

      const result = lineChunkPatched(geometry, 50)

      // Total length ~222m, with 50m input resolution:
      // numSegments = ceil(222/50) = 5, actualResolution = 222/5 ≈ 44.48m
      expect(result.resolutionInMeters).toBeCloseTo(44.48)
      expect(result.geometry.length).toBe(5)
    })

    it('drops very short last segment caused by floating point precision issues', () => {
      // This geometry used to produce a 0-length last segment
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.0796655, 47.4527256, 1692.2],
          [11.079720619903608, 47.45294351099136, 1681.8],
          [11.079741829533312, 47.4531647479081, 1668.6],
          [11.079727503541202, 47.453383892073894, 1656.7],
          [11.07965005139028, 47.453599318647775, 1644.3],
          [11.079572598604779, 47.4538147451695, 1630.9],
          [11.07942834590789, 47.45401183160125, 1618.7],
          [11.079261771477254, 47.45420278959679, 1607.3],
          [11.079114389973567, 47.454399266146474, 1594.7],
          [11.0790705, 47.45461691834462, 1583.1],
          [11.079181898893397, 47.45481861566543, 1576.6],
          [11.079441578857713, 47.45494597233321, 1569.5],
          [11.079759061257176, 47.454999538815876, 1562],
          [11.080078284221905, 47.4550501436389, 1556.1],
          [11.080397507801036, 47.45510074757592, 1552.5],
          [11.080713989344984, 47.45515789593482, 1548.1],
          [11.081008027508169, 47.45525121278351, 1543.2],
          [11.081212874246143, 47.455416412781105, 1540.9],
          [11.081238270576348, 47.455636585144894, 1535.5],
          [11.081208499760809, 47.45585723881769, 1526.8],
          [11.081175991164459, 47.456077847750485, 1510.4],
          [11.081099444790018, 47.456292146692356, 1497.9],
          [11.080996819007606, 47.45650270883295, 1484.3],
          [11.080897169545302, 47.45671391641284, 1472.4],
          [11.080799550285963, 47.45692556428702, 1456.4],
          [11.080701930240755, 47.457137212078344, 1443.9],
          [11.08059047871202, 47.4573452579998, 1434.7],
          [11.080452900000004, 47.45754649999998, 1427.4],
        ],
      }

      const result = lineChunkPatched(geometry, 25)

      // Verify that all segments have correct length
      for (const chunk of result.geometry) {
        const chunkLength = length(
          { type: 'Feature', geometry: chunk, properties: {} },
          { units: 'meters' },
        )
        expect(chunkLength).toBeCloseTo(result.resolutionInMeters)
      }
    })

    it('preserves the exact last point from the original geometry', () => {
      // This geometry had a split last point that was different from the input last point
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.1215994, 47.466431, 886.6],
          [11.118092699999998, 47.4702057, 768.5],
        ],
      }

      const result = lineChunkPatched(geometry, 25)

      // The last point of the last chunk should be exactly the same as the original last point
      const lastChunk = result.geometry[result.geometry.length - 1]
      const lastPoint = lastChunk.coordinates[lastChunk.coordinates.length - 1]
      const originalLastPoint =
        geometry.coordinates[geometry.coordinates.length - 1]

      expect(lastPoint[0]).toBe(originalLastPoint[0])
      expect(lastPoint[1]).toBe(originalLastPoint[1])
      expect(lastPoint[2]).toBe(originalLastPoint[2])
    })

    it('strips elevation from non-original points', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.001, 110], // ~111m distance
          [0, 0.002, 120], // ~111m distance
        ],
      }

      const result = lineChunkPatched(geometry, 50)

      // Check that interpolated points (not from original geometry) don't have elevation
      for (const chunk of result.geometry) {
        for (const point of chunk.coordinates) {
          const key = `${point[0]},${point[1]}`
          const originalKey = geometry.coordinates.some(
            (c) => `${c[0]},${c[1]}` === key,
          )

          if (!originalKey) {
            // Non-original points should not have elevation (should be 2D)
            expect(point.length).toBe(2)
          } else {
            // Original points should still have elevation
            expect(point.length).toBe(3)
          }
        }
      }
    })

    it('handles very short lines', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.00001, 101], // ~1.11m distance
        ],
      }

      const result = lineChunkPatched(geometry, 25)

      // Should create a single chunk for very short lines
      expect(result.geometry.length).toBe(1)
      expect(result.resolutionInMeters).toBeCloseTo(1.11)
    })

    it('handles lines with exact multiples of resolution', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.0009, 110],
        ],
      }

      const result = lineChunkPatched(geometry, 50)

      // The actual distance is calculated and divided evenly
      // Resolution should be <= 50m
      expect(result.resolutionInMeters).toBeLessThanOrEqual(50)
      expect(result.geometry.length).toBeGreaterThanOrEqual(1)
    })

    it('returns first and last points matching original geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [11.177425600412874, 47.31265682344346, 100],
          [11.177224899122194, 47.312533118812354, 110],
          [11.176823496540862, 47.31229807921545, 105],
        ],
      }

      const result = lineChunkPatched(geometry, 25)

      // First point of first chunk should match original first point
      const firstPoint = result.geometry[0].coordinates[0]
      expect(firstPoint[0]).toBe(geometry.coordinates[0][0])
      expect(firstPoint[1]).toBe(geometry.coordinates[0][1])
      expect(firstPoint[2]).toBe(geometry.coordinates[0][2])

      // Last point of last chunk should match original last point
      const lastChunk = result.geometry[result.geometry.length - 1]
      const lastPoint = lastChunk.coordinates[lastChunk.coordinates.length - 1]
      const originalLastPoint =
        geometry.coordinates[geometry.coordinates.length - 1]
      expect(lastPoint[0]).toBe(originalLastPoint[0])
      expect(lastPoint[1]).toBe(originalLastPoint[1])
      expect(lastPoint[2]).toBe(originalLastPoint[2])
    })

    it('calculates resolution that is less than or equal to requested resolution', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.0015, 110], // ~166.7m distance
        ],
      }

      const result = lineChunkPatched(geometry, 50)

      // Resolution should never exceed the requested minimum resolution
      expect(result.resolutionInMeters).toBeLessThanOrEqual(50)
    })

    it('handles zero-length segments in original geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0, 100], // Duplicate point (0 length segment)
          [0, 0.001, 110],
        ],
      }

      const result = lineChunkPatched(geometry, 25)

      // Should still work and produce valid chunks
      expect(result.geometry.length).toBeGreaterThan(0)
      expect(result.resolutionInMeters).toBeGreaterThan(0)
    })

    it('preserves all original points that fall on chunk boundaries', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0, 100],
          [0, 0.0005, 105], // ~55.6m - should be close to a chunk boundary with 50m resolution
          [0, 0.001, 110],
        ],
      }

      const result = lineChunkPatched(geometry, 50)

      // Count how many original points are preserved in the chunks
      let preservedOriginalPoints = 0
      for (const chunk of result.geometry) {
        for (const point of chunk.coordinates) {
          if (
            geometry.coordinates.some(
              (c) => c[0] === point[0] && c[1] === point[1],
            )
          ) {
            preservedOriginalPoints++
          }
        }
      }

      // All original points should be present somewhere in the chunks
      // (Note: points may appear multiple times if they're at chunk boundaries)
      expect(preservedOriginalPoints).toBeGreaterThanOrEqual(
        geometry.coordinates.length,
      )
    })
  })
})
