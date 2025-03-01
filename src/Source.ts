import { exhaustiveMatchingGuard } from './util/exhaustiveMatchingGuard'

export enum SourceType {
  SKIMAP_ORG = 'skimap.org',
  OPENSTREETMAP = 'openstreetmap',
}

export type Source = {
  type: SourceType
  id: string
}

export function getSourceURL(source: Source): string {
  switch (source.type) {
    case SourceType.OPENSTREETMAP:
      return 'https://www.openstreetmap.org/' + source.id
    case SourceType.SKIMAP_ORG:
      return 'https://www.skimap.org/SkiAreas/view/' + source.id
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
    default:
      return exhaustiveMatchingGuard(type)
  }
}
