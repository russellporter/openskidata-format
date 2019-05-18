export enum SourceType {
  SKIMAP_ORG = "skimap.org"
}

export default interface Source {
  type: SourceType;
  id: string;
}
