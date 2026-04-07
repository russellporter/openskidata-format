import { FeatureType } from './FeatureType';
import { getLiftElevationData, LiftFeature, LiftType, getFormattedLiftType, getLiftColor } from './Lift';
import { mockViewportHint } from './testUtils';
import { LiftStationPosition, LiftStationSpotFeature, SpotType } from './Spot';
import { Status } from './Status';

function makeLiftFeature(overrides: {
  coordinates?: GeoJSON.Position[];
  duration?: number | null;
  stations?: LiftStationSpotFeature[];
}): LiftFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: overrides.coordinates ?? [
        [8.0, 46.0, 1000],
        [8.01, 46.05, 1500],
      ],
    },
    properties: {
      type: FeatureType.Lift,
      id: 'test',
      liftType: LiftType.ChairLift,
      status: Status.Operating,
      access: null,
      name: null,
      ref: null,
      refFRCAIRN: null,
      description: null,
      oneway: null,
      occupancy: null,
      capacity: null,
      duration: overrides.duration !== undefined ? overrides.duration : 600,
      detachable: null,
      bubble: null,
      heating: null,
      tunnel: null,
      stations: overrides.stations ?? [],
      skiAreas: [],
      sources: [],
      websites: [],
      wikidataID: null,
      places: [],
      viewportHint: mockViewportHint(),
    },
  }
}

function makeStation(
  position: LiftStationPosition,
  coordinates: GeoJSON.Position,
): LiftStationSpotFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: {
      type: FeatureType.Spot,
      id: `station-${position}`,
      spotType: SpotType.LiftStation,
      name: null,
      position,
      entry: null,
      exit: null,
      liftId: 'test',
      skiAreas: [],
      sources: [],
      places: [],
      viewportHint: mockViewportHint(),
    },
  }
}

describe('Lift', () => {
  describe('getLiftElevationData', () => {
    it('returns null for non-LineString geometry', () => {
      const feature: LiftFeature = {
        ...makeLiftFeature({}),
        geometry: { type: 'MultiLineString', coordinates: [] },
      }
      expect(getLiftElevationData(feature)).toBeNull()
    })

    it('returns null when coordinates have no elevation', () => {
      const feature = makeLiftFeature({
        coordinates: [[8.0, 46.0], [8.01, 46.05]],
      })
      expect(getLiftElevationData(feature)).toBeNull()
    })

    it('returns null speed when duration is null', () => {
      const result = getLiftElevationData(makeLiftFeature({ duration: null }))
      expect(result?.speedInMetersPerSecond).toBeNull()
      expect(result?.verticalSpeedInMetersPerSecond).toBeNull()
    })

    it('uses full geometry length when no stations', () => {
      const feature = makeLiftFeature({ stations: [] })
      const result = getLiftElevationData(feature)!
      expect(result.speedInMetersPerSecond).toBeGreaterThan(0)
      // Speed should be inclinedLength / duration from geometry
      const expectedSpeed = result.inclinedLengthInMeters / 600
      expect(result.speedInMetersPerSecond).toBeCloseTo(expectedSpeed)
    })

    it('uses full geometry length when only one terminal station is present', () => {
      const noStations = makeLiftFeature({ stations: [] })
      const oneStation = makeLiftFeature({
        stations: [makeStation(LiftStationPosition.Bottom, [8.0, 46.0, 1000])],
      })
      const resultNoStations = getLiftElevationData(noStations)!
      const resultOneStation = getLiftElevationData(oneStation)!
      expect(resultOneStation.speedInMetersPerSecond).toBeCloseTo(
        resultNoStations.speedInMetersPerSecond!,
      )
    })

    it('uses station-based distance when top and bottom stations have elevation', () => {
      // Geometry extends beyond the stations (extra approach at each end)
      const feature = makeLiftFeature({
        coordinates: [
          [8.0, 46.0, 900],    // approach before bottom station
          [8.005, 46.01, 1000], // bottom station location
          [8.015, 46.04, 1500], // top station location
          [8.02, 46.05, 1600],  // approach after top station
        ],
        duration: 600,
        stations: [
          makeStation(LiftStationPosition.Bottom, [8.005, 46.01, 1000]),
          makeStation(LiftStationPosition.Top, [8.015, 46.04, 1500]),
        ],
      })

      const resultWithStations = getLiftElevationData(feature)!

      // Without stations, use full geometry (which is longer)
      const featureNoStations = makeLiftFeature({
        coordinates: [
          [8.0, 46.0, 900],
          [8.005, 46.01, 1000],
          [8.015, 46.04, 1500],
          [8.02, 46.05, 1600],
        ],
        duration: 600,
        stations: [],
      })
      const resultNoStations = getLiftElevationData(featureNoStations)!

      // Station-based distance is shorter → lower speed
      expect(resultWithStations.speedInMetersPerSecond).toBeLessThan(
        resultNoStations.speedInMetersPerSecond!,
      )
      expect(resultWithStations.verticalSpeedInMetersPerSecond).toBeLessThan(
        resultNoStations.verticalSpeedInMetersPerSecond!,
      )
    })

    it('falls back to geometry when stations have no elevation', () => {
      const featureWithStations = makeLiftFeature({
        stations: [
          makeStation(LiftStationPosition.Bottom, [8.0, 46.0]),  // no Z
          makeStation(LiftStationPosition.Top, [8.01, 46.05]),    // no Z
        ],
      })
      const featureNoStations = makeLiftFeature({ stations: [] })

      const resultWithStations = getLiftElevationData(featureWithStations)!
      const resultNoStations = getLiftElevationData(featureNoStations)!

      expect(resultWithStations.speedInMetersPerSecond).toBeCloseTo(
        resultNoStations.speedInMetersPerSecond!,
      )
    })
  })

  describe('getFormattedLiftType', () => {
    it('should format lift types correctly', () => {
      expect(getFormattedLiftType(LiftType.ChairLift)).toBe('Chairlift');
      expect(getFormattedLiftType(LiftType.Gondola)).toBe('Gondola');
      expect(getFormattedLiftType(LiftType.MagicCarpet)).toBe('Magic Carpet');
    });
  });

  describe('getLiftColor', () => {
    it('should return dim red for disused lifts', () => {
      expect(getLiftColor(Status.Disused)).toBe('hsl(0, 53%, 42%)');
      expect(getLiftColor(Status.Abandoned)).toBe('hsl(0, 53%, 42%)');
    });

    it('should return bright red for operating lifts', () => {
      expect(getLiftColor(Status.Operating)).toBe('hsl(0, 82%, 42%)');
      expect(getLiftColor(Status.Construction)).toBe('hsl(0, 82%, 42%)');
    });
  });
});
