import { ElevationData, getElevationData } from './ElevationProfile'
import { FeatureType } from './FeatureType'
import { SkiAreaSummaryFeature } from './SkiArea'
import { Source } from './Source'
import { Status } from './Status'
import { exhaustiveMatchingGuard } from './util/exhaustiveMatchingGuard'

export type LiftFeature = GeoJSON.Feature<LiftGeometry, LiftProperties>

export type LiftGeometry =
  | GeoJSON.Point
  | GeoJSON.MultiPoint
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon

/**
 * A feature representing a ski lift.
 *
 * Lifts are derived from OpenStreetMap aerialway/railway features that are commonly used for winter sports.
 *
 * Note:
 * - Private lifts are not included in this dataset.
 * - Railways (except funiculars) are included only if they are part of a site=piste relation.
 * - Railway parts are not merged together so a single railway line may be represented as multiple features.
 * - Some lifts included in the dataset may be for other purposes (amusement parks, etc).
 *
 * Properties:
 * @property {FeatureType.Lift} type - The feature type, which is always 'Lift'.
 * @property {string} id - Unique identifier for the lift. The ID is just a hash of the feature, so will change if the feature changes in any way.
 * @property {LiftType} liftType - Type of lift (e.g. chair_lift, gondola). Derived from OpenStreetMap aerialway/railway tags.
 * @property {Status} status - Operational status of the lift. Derived from OpenStreetMap lifecycle tags.
 * @property {string | null} name - Name of the lift. Derived from the OpenStreetMap name tag.
 * @property {string | null} ref - Reference code/number for the lift. Derived from the OpenStreetMap ref tag.
 * @property {string | null} description - Description of the lift. Derived from the OpenStreetMap description tag.
 * @property {boolean | null} oneway - Whether the lift allows riding only in one direction. Derived from the OpenStreetMap oneway tag.
 * @property {number | null} occupancy - Number of people each carrier can transport. Derived from the OpenStreetMap aerialway:occupancy tag.
 * @property {number | null} capacity - Transport capacity in persons/hour. Derived from the OpenStreetMap aerialway:capacity tag.
 * @property {number | null} duration - Duration of lift ride in seconds. Derived from the OpenStreetMap aerialway:duration tag.
 * @property {boolean | null} detachable - Whether the lift has detachable grips. Derived from the OpenStreetMap aerialway:detachable tag.
 * @property {boolean | null} bubble - Whether the lift has bubbles/covers to protect from weather. Derived from the OpenStreetMap aerialway:bubble tag.
 * @property {boolean | null} heating - Whether the lift has heated carriers/seats. Derived from the OpenStreetMap aerialway:heating tag.
 * @property {SkiAreaSummaryFeature[]} skiAreas - Ski areas this lift is a part of.
 * @property {Source[]} sources - Data sources for the feature.
 * @property {string[]} websites - Websites associated with this lift. Derived from the OpenStreetMap website tag.
 * @property {string | null} wikidata_id - Wikidata identifier. Derived from the OpenStreetMap wikidata tag.
 */
export type LiftProperties = {
  type: FeatureType.Lift
  id: string
  liftType: LiftType
  status: Status
  name: string | null
  ref: string | null
  description: string | null
  oneway: boolean | null
  occupancy: number | null
  capacity: number | null
  duration: number | null
  detachable: boolean | null
  bubble: boolean | null
  heating: boolean | null
  skiAreas: SkiAreaSummaryFeature[]
  sources: Source[]
  websites: string[]
  wikidata_id: string | null
}

export enum LiftType {
  CableCar = 'cable_car',
  Gondola = 'gondola',
  ChairLift = 'chair_lift',
  MixedLift = 'mixed_lift',
  DragLift = 'drag_lift',
  TBar = 't-bar',
  JBar = 'j-bar',
  Platter = 'platter',
  RopeTow = 'rope_tow',
  MagicCarpet = 'magic_carpet',
  Funicular = 'funicular',
  Railway = 'railway',
}

export type LiftElevationData = ElevationData & {
  speedInMetersPerSecond: number | null
  verticalSpeedInMetersPerSecond: number | null
}

export function getLiftElevationData(
  feature: LiftFeature,
): LiftElevationData | null {
  const geometry = feature.geometry
  if (
    !geometry ||
    geometry.type !== 'LineString' ||
    geometry.coordinates[0].length < 3
  ) {
    return null
  }

  const elevationData = getElevationData(geometry)
  const durationInSeconds = feature.properties.duration

  return {
    ...elevationData,
    speedInMetersPerSecond: durationInSeconds
      ? elevationData.inclinedLengthInMeters / durationInSeconds
      : null,
    verticalSpeedInMetersPerSecond: durationInSeconds
      ? elevationData.verticalInMeters / durationInSeconds
      : null,
  }
}

export function getFormattedLiftType(liftType: LiftType): string {
  switch (liftType) {
    case LiftType.CableCar:
      return 'Cable Car'
    case LiftType.Gondola:
      return 'Gondola'
    case LiftType.ChairLift:
      return 'Chairlift'
    case LiftType.MixedLift:
      return 'Hybrid'
    case LiftType.DragLift:
      return 'Drag lift'
    case LiftType.TBar:
      return 'T-bar'
    case LiftType.JBar:
      return 'J-bar'
    case LiftType.Platter:
      return 'Platter'
    case LiftType.RopeTow:
      return 'Ropetow'
    case LiftType.MagicCarpet:
      return 'Magic Carpet'
    case LiftType.Funicular:
      return 'Funicular'
    case LiftType.Railway:
      return 'Railway'
    default:
      return exhaustiveMatchingGuard(liftType)
  }
}

export function getLiftColor(status: Status): string {
  const BRIGHT_RED_COLOR = 'hsl(0, 82%, 42%)'
  const DIM_RED_COLOR = 'hsl(0, 53%, 42%)'

  switch (status) {
    case Status.Disused:
    case Status.Abandoned:
      return DIM_RED_COLOR
    case Status.Proposed:
    case Status.Planned:
    case Status.Construction:
    case Status.Operating:
      return BRIGHT_RED_COLOR
    default:
      return exhaustiveMatchingGuard(status)
  }
}
