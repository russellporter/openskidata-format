import { exhaustiveMatchingGuard } from './util/exhaustiveMatchingGuard'

export enum SourceType {
  SKIMAP_ORG = 'skimap.org',
  OPENSTREETMAP = 'openstreetmap',
  STORM_SKIING = 'stormskiing.com',
}

export type Source = {
  type: SourceType
  id: string
}

/**
 * The Storm Skiing Journal's ski pass chart, a Google Sheets document.
 *
 * A `STORM_SKIING` source id references a single cell of that document, in `<gid>!<A1>` form
 * (e.g. `677843907!AI64`), so it can be linked to directly.
 */
export const STORM_SKIING_CHART_DOCUMENT_ID =
  '1G2-l2DVg7-QwroOi7EqRDrJYJ4ICYLcJbLx-nARJdrA'

/**
 * URL of the CSV export of one sheet of the ski pass chart. Used to fetch the chart; the ids of
 * the sources derived from it are resolved by `getSourceURL`.
 */
export function getStormSkiingChartCSVURL(gid: string): string {
  return (
    `https://docs.google.com/spreadsheets/d/${STORM_SKIING_CHART_DOCUMENT_ID}` +
    `/export?format=csv&gid=${gid}`
  )
}

export function getSourceURL(source: Source): string {
  switch (source.type) {
    case SourceType.OPENSTREETMAP:
      return 'https://www.openstreetmap.org/' + source.id
    case SourceType.SKIMAP_ORG:
      return 'https://www.skimap.org/SkiAreas/view/' + source.id
    case SourceType.STORM_SKIING: {
      const separatorIndex = source.id.indexOf('!')
      if (separatorIndex === -1) {
        throw new Error(
          `Malformed ${SourceType.STORM_SKIING} source id "${source.id}". Expected <gid>!<A1 reference>.`,
        )
      }
      const gid = source.id.slice(0, separatorIndex)
      const range = source.id.slice(separatorIndex + 1)
      // The gid appears twice: as a query parameter to select the sheet, and in the fragment,
      // which is the only place Google Sheets accepts a cell range.
      return (
        `https://docs.google.com/spreadsheets/d/${STORM_SKIING_CHART_DOCUMENT_ID}` +
        `/edit?gid=${gid}#gid=${gid}&range=${range}`
      )
    }
    default:
      return exhaustiveMatchingGuard(source.type)
  }
}

export function getSourceName(type: SourceType): string {
  switch (type) {
    case SourceType.OPENSTREETMAP:
      return 'OpenStreetMap'
    case SourceType.SKIMAP_ORG:
      return 'Skimap.org'
    case SourceType.STORM_SKIING:
      return 'The Storm Skiing Journal'
    default:
      return exhaustiveMatchingGuard(type)
  }
}
