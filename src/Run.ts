import * as GeoJSON from 'geojson'
import {
  ElevationData,
  ElevationProfile,
  getElevationData,
  getProfileGeometry,
} from './ElevationProfile'
import { FeatureType } from './FeatureType'
import { Place } from './Place'
import { RunDifficultyConvention } from './RunDifficultyConvention'
import { SkiAreaSummaryFeature } from './SkiArea'
import { SnowCoverHistory } from './SnowCoverHistory'
import { Source } from './Source'
import { Status } from './Status'
import { exhaustiveMatchingGuard } from './util/exhaustiveMatchingGuard'

export type RunGeometry = GeoJSON.LineString | GeoJSON.Polygon

/**
 * Represents a segment of a ski run/trail.
 *
 * Runs are derived from OpenStreetMap pistes, which are defined as all ways/areas/relations containing a "piste:type" tag.
 * Piste relations support is limited, it is only used to enhance the data of its member ways. There is no way to access the relation itself in the output data.
 *
 * A single run as marked on the mountain may be broken up into several run features, especially if the run has branches, or changes in tags (e.g. difficulty, use).
 *
 * In the future, there might be a "Route" entity introduced to represent a whole run, which would be composed of multiple run features.
 *
 * Note: winter hiking trails and trails of other winter sports disciplines are also included in this dataset.
 *
 * In postprocessing:
 * - overlapping ways are merged into a single run feature with multiple uses.
 * - connected run segments with the same properties are merged into a single run feature.
 */
export type RunFeature = GeoJSON.Feature<RunGeometry, RunProperties>

/**
 * Represents the properties of a ski run.
 *
 * Properties:
 * @property {FeatureType.Run} type - The feature type, which is always 'Run'.
 * @property {RunUse[]} uses - Use types for the run (e.g. downhill, nordic), derived from OpenStreetMap "piste:type" tags.
 * @property {string} id - Unique identifier for the run. The ID is just a hash of the feature, so will change if the feature changes in any way.
 * @property {string | null} name - Name of the run, if available
 * @property {string | null} ref - Reference code/number for the run. Derived from the OpenStreetMap piste:ref and ref tags.
 * @property {Status} status - Operational status. Note: as only operational runs are included in this dataset, this will always be 'operating'.
 * @property {string | null} description - Description of the run, derived from the OpenStreetMap "piste:description" or "description" tag.
 * @property {RunDifficulty | null} difficulty - Difficulty rating of the run, derived from the OpenStreetMap "piste:difficulty" tag
 * @property {RunDifficultyConvention} difficultyConvention - Regional convention used for representing run difficulty. Derived from location.
 * @property {boolean | null} oneway - Whether the run is one-way only, derived from the OpenStreetMap "piste:oneway" or "oneway" tag, in addition to defaults based on run use.
 * @property {boolean | null} lit - Whether the run has lighting for night skiing, derived from the OpenStreetMap "piste:lit" or "lit" tag.
 * @property {boolean | null} gladed - Whether the run is through gladed/tree terrain, derived from the OpenStreetMap "piste:gladed" or "gladed" tag.
 * @property {boolean | null} patrolled - Whether the run is patrolled by ski patrol, derived from the OpenStreetMap "piste:patrolled" or "patrolled" tag.
 * @property {RunGrooming | null} grooming - Grooming status/type of the run, derived from the OpenStreetMap "piste:grooming" tag. If not specified explicitly, for difficulties "expert", "freeride", and "extreme", grooming is assumed to be "backcountry".
 * @property {SkiAreaSummaryFeature[]} skiAreas - Ski areas this run belongs to. Derived from the OpenStreetMap site=piste relation or landuse=winter_sports area and proximity to ski area features. Runs with "backcountry" grooming are not associated with ski areas unless they have a "piste:patrolled=yes" or "patrolled=yes" OpenStreetMap tag, or are part of a "site=piste" ski area relation.
 * @property {ElevationProfile | null} elevationProfile - Elevation profile of the run, only available for runs with LineString geometry.
 * @property {Source[]} sources - Data sources for this run's information
 * @property {string[]} websites - Websites associated with this run, derived from the OpenStreetMap website tag
 * @property {string | null} wikidataID - Wikidata identifier, if available, derived from the OpenStreetMap wikidata tag
 * @property {Place[]} places - Geographic places this run is within (e.g., city, region, country). Derived from reverse geocoding.
 * @property {SnowCoverHistory} [snowCoverHistory] - Historical snow cover data for this run, if available
 */
export type RunProperties = {
  type: FeatureType.Run
  uses: RunUse[]
  id: string
  name: string | null
  ref: string | null
  status: Status
  description: string | null
  difficulty: RunDifficulty | null
  difficultyConvention: RunDifficultyConvention
  oneway: boolean | null
  lit: boolean | null
  gladed: boolean | null
  patrolled: boolean | null
  grooming: RunGrooming | null
  skiAreas: SkiAreaSummaryFeature[]
  elevationProfile: ElevationProfile | null
  sources: Source[]
  websites: string[]
  wikidataID: string | null
  places: Place[]
  snowCoverHistory?: SnowCoverHistory
}

export enum RunUse {
  Downhill = 'downhill',
  Nordic = 'nordic',
  Skitour = 'skitour',
  Sled = 'sled',
  Hike = 'hike',
  Sleigh = 'sleigh',
  IceSkate = 'ice_skate',
  SnowPark = 'snow_park',
  Playground = 'playground',
  Connection = 'connection',
  Fatbike = 'fatbike',
}

export enum RunGrooming {
  Classic = 'classic',
  Mogul = 'mogul',
  ClassicAndSkating = 'classic+skating',
  Skating = 'skating',
  Scooter = 'scooter',
  Backcountry = 'backcountry',
}

export enum RunDifficulty {
  NOVICE = 'novice',
  EASY = 'easy',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  FREERIDE = 'freeride',
  EXTREME = 'extreme',
}

export enum RunColorName {
  GREEN = 'green',
  BLUE = 'blue',
  RED = 'red',
  BLACK = 'black',
  ORANGE = 'orange',
  GREY = 'grey',
}

export enum RunColorValue {
  GREEN = 'hsl(125, 100%, 33%)',
  BLUE = 'hsl(208, 100%, 33%)',
  RED = 'hsl(359, 94%, 53%)',
  BLACK = 'hsl(0, 0%, 0%)',
  ORANGE = 'hsl(34, 100%, 50%)',
  GREY = 'hsl(0, 0%, 35%)',
}


export function getRunElevationData(feature: RunFeature): ElevationData | null {
  const geometry = feature.geometry
  const profile = feature.properties.elevationProfile
  if (!profile || !geometry || geometry.type !== 'LineString') {
    return null
  }

  // Get a geometry that includes elevation data at an even spacing along the run
  const profileGeometry = getProfileGeometry(geometry, profile)
  return getElevationData(profileGeometry)
}

export function getRunColor(
  convention: RunDifficultyConvention,
  difficulty: RunDifficulty | null,
): RunColorValue {
  return runColorNameToValue(getRunColorName(convention, difficulty))
}

export function runColorNameToValue(color: RunColorName): RunColorValue {
  switch (color) {
    case RunColorName.GREEN:
      return RunColorValue.GREEN
    case RunColorName.BLUE:
      return RunColorValue.BLUE
    case RunColorName.RED:
      return RunColorValue.RED
    case RunColorName.BLACK:
      return RunColorValue.BLACK
    case RunColorName.ORANGE:
      return RunColorValue.ORANGE
    case RunColorName.GREY:
      return RunColorValue.GREY
    default:
      throw 'invalid color'
  }
}

export function getRunColorName(
  convention: RunDifficultyConvention,
  difficulty: RunDifficulty | null,
): RunColorName {
  switch (convention) {
    case RunDifficultyConvention.EUROPE:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
          return RunColorName.GREEN
        case RunDifficulty.EASY:
          return RunColorName.BLUE
        case RunDifficulty.INTERMEDIATE:
          return RunColorName.RED
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return RunColorName.BLACK
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return RunColorName.ORANGE
        default:
          return RunColorName.GREY
      }
    case RunDifficultyConvention.JAPAN:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
        case RunDifficulty.EASY:
          return RunColorName.GREEN
        case RunDifficulty.INTERMEDIATE:
          return RunColorName.RED
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return RunColorName.BLACK
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return RunColorName.ORANGE
        default:
          return RunColorName.GREY
      }
    case RunDifficultyConvention.NORTH_AMERICA:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
        case RunDifficulty.EASY:
          return RunColorName.GREEN
        case RunDifficulty.INTERMEDIATE:
          return RunColorName.BLUE
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return RunColorName.BLACK
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return RunColorName.ORANGE
        default:
          return RunColorName.GREY
      }
    default:
      return exhaustiveMatchingGuard(convention)
  }
}
