import * as GeoJSON from 'geojson'
import { FeatureType } from './FeatureType'
import { Place } from './Place'
import { SkiAreaSummaryFeature } from './SkiArea'
import { Source } from './Source'

/**
 * A GeoJSON feature representing a spot (point of interest) in or around a ski area.
 *
 * Spots are used to represent lift stations, road crossings, or certain terrain features.
 */
export type SpotFeature = GeoJSON.Feature<SpotGeometry, SpotProperties>

/**
 * A GeoJSON feature representing a lift station spot.
 */
export type LiftStationSpotFeature = GeoJSON.Feature<
  SpotGeometry,
  LiftStationSpotProperties
>

/**
 * Geometry type for spots - always a point.
 */
export type SpotGeometry = GeoJSON.Point

/**
 * Union of all spot property types.
 */
export type SpotProperties =
  | CrossingSpotProperties
  | LiftStationSpotProperties
  | AvalancheTransceiverTrainingSpotProperties
  | AvalancheTransceiverCheckpointSpotProperties
  | HalfpipeSpotProperties

/**
 * Base properties shared by all spot types.
 */
export type SpotBaseProperties = {
  type: FeatureType.Spot
  id: string
  skiAreas: SkiAreaSummaryFeature[]
  sources: Source[]
  places: Place[]
}

/**
 * Types of spots that can be found in or around ski areas.
 */
export enum SpotType {
  Crossing = 'crossing',
  LiftStation = 'lift_station',
  AvalancheTransceiverTraining = 'avalanche_transceiver_training',
  AvalancheTransceiverCheckpoint = 'avalanche_transceiver_checkpoint',
  Halfpipe = 'halfpipe',
}

/**
 * A crossing is a point where a ski run intersects with a road or path,
 * potentially requiring skiers to remove their skis.
 *
 * From OpenStreetMap node with tag `piste:dismount=yes|no|sometimes`.
 */
export type CrossingSpotProperties = SpotBaseProperties & {
  spotType: SpotType.Crossing
  dismount: DismountRequirement
}

/**
 * Whether dismounting from skis is required at a crossing.
 */
export enum DismountRequirement {
  Yes = 'yes',
  No = 'no',
  Sometimes = 'sometimes',
}

/**
 * A lift station is a boarding or alighting point for a ski lift.
 *
 * From OpenStreetMap node or area with tag `aerialway=station`.
 * Areas are represented as a point (centroid).
 *
 * @property {string | null} name - Name of the station, from OpenStreetMap tag `name`.
 * @property {LiftStationPosition | null} position - From OpenStreetMap tag `aerialway:station=bottom|mid|top`.
 * @property {boolean | null} entry - Whether passengers can board here. From OpenStreetMap tag `aerialway:access=entry|both|no`.
 * @property {boolean | null} exit - Whether passengers can alight here. From OpenStreetMap tag `aerialway:access=exit|both|no`.
 * @property {string} liftId - ID of the lift feature associated with this station.
 */
export type LiftStationSpotProperties = SpotBaseProperties & {
  spotType: SpotType.LiftStation
  name: string | null
  position: LiftStationPosition | null
  entry: boolean | null
  exit: boolean | null
  liftId: string
}

/**
 * Position of a lift station along the lift line.
 */
export enum LiftStationPosition {
  Top = 'top',
  Mid = 'mid',
  Bottom = 'bottom',
}

/**
 * A designated area where skiers can practice using avalanche transceivers.
 *
 * From OpenStreetMap node or area with tags `amenity=avalanche_transceiver` and `avalanche_transceiver=training`.
 * Areas are represented as a point (centroid).
 */
export type AvalancheTransceiverTrainingSpotProperties = SpotBaseProperties & {
  spotType: SpotType.AvalancheTransceiverTraining
}

/**
 * A checkpoint where skiers can verify their avalanche transceiver is functioning.
 *
 * From OpenStreetMap node or area with tags `amenity=avalanche_transceiver` and `avalanche_transceiver=checkpoint`.
 * Areas are represented as a point (centroid).
 */
export type AvalancheTransceiverCheckpointSpotProperties =
  SpotBaseProperties & {
    spotType: SpotType.AvalancheTransceiverCheckpoint
  }

/**
 * A halfpipe structure for freestyle skiing or snowboarding.
 *
 * From OpenStreetMap node/way/area with tag `man_made=piste:halfpipe`.
 * Areas are represented as a point (centroid).
 */
export type HalfpipeSpotProperties = SpotBaseProperties & {
  spotType: SpotType.Halfpipe
}
