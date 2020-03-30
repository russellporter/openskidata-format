import * as GeoJSON from 'geojson'
import { ElevationProfile } from './ElevationProfile'
import { FeatureType } from './FeatureType'
import { Status } from './Status'

export type RunGeometry = GeoJSON.LineString | GeoJSON.Polygon

export type RunFeature = GeoJSON.Feature<RunGeometry, RunProperties>

export type RunProperties = {
  type: FeatureType.Run
  uses: RunUse[]
  id: string
  name: string | null
  ref: string | null
  status: Status
  description: string | null
  difficulty: RunDifficulty | null
  oneway: boolean | null
  lit: boolean | null
  gladed: boolean | null
  patrolled: boolean | null
  color: string
  colorName: ColorName
  grooming: RunGrooming | null
  skiAreas: string[]
  elevationProfile: ElevationProfile | null
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

export enum ColorName {
  GREEN = 'green',
  BLUE = 'blue',
  RED = 'red',
  BLACK = 'black',
  ORANGE = 'orange',
  GREY = 'grey',
}

export enum RunConvention {
  EUROPE = 'europe',
  JAPAN = 'japan',
  NORTH_AMERICA = 'north_america',
}

// When adding a new color, add a supplemental oneway icon on the map style
const GREEN_COLOR = 'hsl(125, 100%, 33%)'
const BLUE_COLOR = 'hsl(208, 100%, 33%)'
const RED_COLOR = 'hsl(359, 94%, 53%)'
const BLACK_COLOR = 'hsl(0, 0%, 0%)'
const ORANGE_COLOR = 'hsl(34, 100%, 50%)'
const GREY_COLOR = 'hsl(0, 0%, 65%)'

export function getColorName(color: string): ColorName {
  switch (color) {
    case GREEN_COLOR:
      return ColorName.GREEN
    case BLUE_COLOR:
      return ColorName.BLUE
    case RED_COLOR:
      return ColorName.RED
    case BLACK_COLOR:
      return ColorName.BLACK
    case ORANGE_COLOR:
      return ColorName.ORANGE
    case GREY_COLOR:
      return ColorName.GREY
    default:
      throw 'missing color'
  }
}

export function getRunColor(
  convention: RunConvention,
  difficulty: RunDifficulty | null,
): string {
  switch (convention) {
    case RunConvention.EUROPE:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
          return GREEN_COLOR
        case RunDifficulty.EASY:
          return BLUE_COLOR
        case RunDifficulty.INTERMEDIATE:
          return RED_COLOR
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return BLACK_COLOR
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return ORANGE_COLOR
        default:
          return GREY_COLOR
      }
    case RunConvention.JAPAN:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
        case RunDifficulty.EASY:
          return GREEN_COLOR
        case RunDifficulty.INTERMEDIATE:
          return RED_COLOR
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return BLACK_COLOR
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return ORANGE_COLOR
        default:
          return GREY_COLOR
      }
    case RunConvention.NORTH_AMERICA:
      switch (difficulty) {
        case RunDifficulty.NOVICE:
        case RunDifficulty.EASY:
          return GREEN_COLOR
        case RunDifficulty.INTERMEDIATE:
          return BLUE_COLOR
        case RunDifficulty.ADVANCED:
        case RunDifficulty.EXPERT:
          return BLACK_COLOR
        case RunDifficulty.FREERIDE:
        case RunDifficulty.EXTREME:
          return ORANGE_COLOR
        default:
          return GREY_COLOR
      }
  }
}
