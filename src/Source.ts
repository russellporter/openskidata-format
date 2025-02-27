export enum SourceType {
  SKIMAP_ORG = 'skimap.org',
  OPENSTREETMAP = 'openstreetmap',
}

export type Source = {
  type: SourceType
  id: string
}
