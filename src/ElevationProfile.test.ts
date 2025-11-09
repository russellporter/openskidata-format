import {
  extractPointsForElevationProfile,
  getAscentAndDescent,
  getPitchData,
} from './ElevationProfile'
import { FeatureType } from './FeatureType'
import { getLiftElevationData, LiftFeature, LiftType } from './Lift'
import {
  getRunElevationData,
  RunDifficulty,
  RunFeature,
  RunUse,
} from './Run'
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

      expect(result.maxPitchInPercent).toBeCloseTo(0.377)
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

      expect(result.coordinates.length).toEqual(12)
      expect(result.coordinates[0]).toEqual([
        11.177452968770694, 47.312650638218656,
      ])
      expect(result.coordinates[result.coordinates.length - 1]).toEqual([
        11.175409464719593, 47.31138883724759,
      ])
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
      expect(result.coordinates.length).toBeGreaterThan(1)
      expect(result.coordinates[0].length).toBe(2) // Should always return 2D points
      expect(result.coordinates[0]).toEqual([
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
          grooming: null,
          websites: [],
          wikidataID: null,
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
          grooming: null,
          websites: [],
          wikidataID: null,
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
          coordinates: [[[0, 0, 100], [1, 1, 200]]],
        },
        properties: {
          type: FeatureType.Lift,
          id: '123',
          liftType: LiftType.ChairLift,
          status: Status.Operating,
          name: 'Test Lift',
          skiAreas: [],
          sources: [],
          ref: null,
          description: null,
          oneway: null,
          occupancy: null,
          capacity: null,
          duration: null,
          detachable: null,
          bubble: null,
          heating: null,
          websites: [],
          wikidataID: null,
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
            resolution: 25,
          },
          sources: [],
          websites: [],
          wikidataID: null,
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
      expect(result?.maxPitchInPercent).toBeCloseTo(0.12, 2)
    })
  })
})
