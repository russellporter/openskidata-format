export enum SourceType {
  SKIMAP_ORG = 'skimap.org',
  OPENSTREETMAP = 'openstreetmap',
}

export default interface Source {
  type: SourceType
  id: string
}
