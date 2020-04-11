import { FeatureType } from './FeatureType'
import Source from './Source'
import { Status } from './Status'

export type LiftFeature = GeoJSON.Feature<LiftGeometry, LiftProperties>

export type LiftGeometry =
  | GeoJSON.Point
  | GeoJSON.MultiPoint
  | GeoJSON.LineString
  | GeoJSON.MultiLineString
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon

export type LiftProperties = {
  type: FeatureType.Lift
  id: string
  liftType: LiftType
  status: Status
  color: string
  name: string | null
  ref: string | null
  description: string | null
  oneway: boolean | null
  occupancy: number | null
  capacity: number | null
  duration: number | null
  bubble: boolean | null
  heating: boolean | null
  skiAreas: string[]
  sources: Source[]
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
  RackRailway = 'rack_railway',
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
    case LiftType.RackRailway:
      return 'Rack Railway'
  }
}
