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
  RunDifficultyConvention,
  RunFeature,
  RunUse,
} from './Run'
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

      expect(result.maxPitchInPercent).toBeCloseTo(0.489)
      expect(result.averagePitchInPercent).toBeCloseTo(0.2482)
      expect(result.inclinedLengthInMeters).toBeCloseTo(63.0597)
    })

    it('throws error when elevation data is missing', () => {
      const profileGeometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(() => getPitchData(profileGeometry)).toThrow(
        'Elevation data is required for slope analysis',
      )
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
          wikidata_id: null,
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
          wikidata_id: null,
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
          type: 'Point',
          coordinates: [0, 0, 100],
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
          wikidata_id: null,
        },
      }

      expect(getLiftElevationData(liftFeature)).toBeNull()
    })
  })
})
