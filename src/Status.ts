/**
 * Status of a feature. Note that this is not real-time status but indicates whether a feature is in operation when conditions permit or is abandoned, etc.
 *
 * Primarily derived from OpenStreetMap tags.
 * Additionally, Skimap.org data provides status information for ski area features only.
 *
 * Tagging schemes supported are:
 * - lifecycle prefixes (preferred) https://wiki.openstreetmap.org/wiki/Lifecycle_prefix
 * - separate lifecycle tags ("proposed=yes", etc)
 */
export enum Status {
  Operating = 'operating',
  Disused = 'disused',
  Abandoned = 'abandoned',
  Proposed = 'proposed',
  Planned = 'planned',
  Construction = 'construction',
}
