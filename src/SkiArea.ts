import { FeatureType } from './FeatureType'
import { LiftType } from './Lift'
import { Place } from './Place'
import { RunDifficulty } from './Run'
import { RunDifficultyConvention } from './RunDifficultyConvention'
import { SnowCoverHistory } from './SnowCoverHistory'
import { Source } from './Source'
import { Status } from './Status'

/**
 * A ski area feature is derived from several sources:
 * - OpenStreetMap site=piste relations (must contain at least one lift or run of any kind)
 * - OpenStreetMap landuse=winter_sports areas (must contain at least one downhill/nordic (non-backcountry) run or operational lift)
 * - Skimap.org ski areas
 *
 * The processor attempts to merge the data of all sources to create a single ski area feature.
 *
 * In some cases merging may fail and duplicate ski areas will be produced. This is likely due to ambiguous data.
 * Check:
 * - that a site=piste relation contains all the lifts/runs. If many lifts/runs are missing, merging will fail.
 * - that if there are multiple landuse=winter_sports areas representing a single ski area. In this case a multipolygon relation should be used.
 * - that if there are multiple Skimap.org ski areas representing a single ski area.
 *
 * General recommendation for ski area tagging in OpenStreetMap:
 * - start with a landuse=winter_sports area as it's easy to set up and maintain.
 * - if that's not explicit enough, add a site=piste relation as well.
 *
 * Note: if runs are present but there is no associated ski area source, a ski area feature is generated with no name and no source.
 */
export type SkiAreaFeature = GeoJSON.Feature<SkiAreaGeometry, SkiAreaProperties>

export type SkiAreaGeometry =
  | GeoJSON.Point
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon

export type SkiAreaSummaryFeature = GeoJSON.Feature<
  SkiAreaGeometry,
  SkiAreaSummaryProperties
>

/**
 * @property {string} id - Unique identifier for the ski area. The ID is just a hash of the feature, so will change if the feature changes in any way. If a stable identifier is needed, use the wikidataID property, or a source id.
 * @property {string | null} name - Name of the ski area.
 * @property {Source[]} sources - Data sources.
 * @property {SkiAreaActivity[]} activities - Activities available at this ski area, derived from presence of ski runs and Skimap.org data.
 * @property {SkiAreaStatistics} statistics - Statistics generated from associated runs / lifts.
 * @property {Status | null} status - Operational status. Derived from OpenStreetMap lifecycle tags and Skimap.org data.
 * @property {RunColorConvention} runConvention - Color convention used for runs at this ski area.
 * @property {string[]} websites - Official website(s) of the ski area. Derived from the OpenStreetMap website tag and Skimap.org data.
 * @property {string | null} wikidataID - Wikidata identifier. Derived from the OpenStreetMap wikidata tag.
 * @property {Place[]} places - Geographic places this ski area is within (e.g., city, region, country). Derived from reverse geocoding.
 */
export type SkiAreaProperties = SkiAreaSummaryProperties & {
  sources: Source[]
  statistics?: SkiAreaStatistics
  runConvention: RunDifficultyConvention
  websites: string[]
  wikidataID: string | null
}

export type SkiAreaSummaryProperties = {
  type: FeatureType.SkiArea
  id: string
  name: string | null
  activities: SkiAreaActivity[]
  status: Status | null
  places: Place[]
}

export enum SkiAreaActivity {
  Downhill = 'downhill',
  Nordic = 'nordic',
}

export type SkiAreaStatistics = {
  runs: RunStatistics
  lifts: LiftStatistics
  minElevation?: number
  maxElevation?: number
  snowCover?: SkiAreaSnowCoverStatistics
}

/**
 * Aggregated snow cover data for a ski area's runs.
 */
export type SkiAreaSnowCoverStatistics = {
  overall: SnowCoverHistory
  byActivity: { [key in SkiAreaActivity | 'other']?: SnowCoverHistory }
}

export type RunStatistics = {
  minElevation?: number
  maxElevation?: number
  byActivity: RunStatisticsByActivityAndDifficulty
}

export type RunStatisticsByActivityAndDifficulty = {
  [key in SkiAreaActivity | 'other']?: {
    byDifficulty: RunStatisticsByDifficulty
  }
}

export type RunStatisticsByDifficulty = {
  [key in RunDifficulty | 'other']?: { count: number; lengthInKm: number }
}

export type LiftStatistics = {
  minElevation?: number
  maxElevation?: number
  byType: LiftStatisticsByType
}

export type LiftStatisticsByTypeKey = LiftType | 'other'

export type LiftStatisticsByType = {
  [key in LiftStatisticsByTypeKey]?: { count: number; lengthInKm: number }
}
