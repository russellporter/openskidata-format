import { Source } from './Source.js'

/** Stable identifier for a purchasable ski pass, e.g. "ikon-base". */
export type SkiPassID = string

/** Stable identifier for a family of related ski passes, e.g. "ikon". */
export type SkiPassBrandID = string

/**
 * A ski area's membership of one purchasable ski pass.
 *
 * @property {SkiPassID} passID - Identifier of the ski pass.
 * @property {string} passName - Display name of the ski pass.
 * @property {SkiPassBrandID | null} brandID - Identifier of the pass's brand, or null for a standalone pass.
 * @property {string | null} brandName - Display name of the pass's brand, or null for a standalone pass.
 * @property {string | null} access - Access code, copied verbatim from the source, e.g. "5, 26, 27" or "U". The source documents these per pass in free text, so they are not parsed.
 * @property {number | null} yearJoined - Year the ski area joined this pass, when the source records it.
 * @property {Source[]} sources - Data sources.
 */
export type SkiPassMembership = {
  passID: SkiPassID
  passName: string
  brandID: SkiPassBrandID | null
  brandName: string | null
  access: string | null
  yearJoined: number | null
  sources: Source[]
}

/**
 * A family of related ski passes, used to group the purchasable passes in a catalogue.
 *
 * @property {SkiPassBrandID} id - Stable identifier for the brand.
 * @property {string} name - Display name of the brand.
 * @property {Source[]} sources - Data sources shared by the brand's passes.
 */
export type SkiPassBrand = {
  type: 'skiPassBrand'
  id: SkiPassBrandID
  name: string
  sources: Source[]
}

/**
 * A multi-resort season pass.
 *
 * Unlike runs, lifts, ski areas and spots, a ski pass is not a geographic feature: it is a
 * commercial product that covers a set of ski areas. The ski areas it covers each carry a
 * matching `SkiPassMembership`.
 *
 * @property {SkiPassID} id - Unique identifier for the ski pass. Unlike a ski area ID, this is stable across runs.
 * @property {string} name - Name of the ski pass.
 * @property {SkiPassBrandID | null} brandID - Identifier of the pass's brand, or null for a standalone pass.
 * @property {string | null} brandName - Display name of the pass's brand, or null for a standalone pass.
 * @property {Source[]} sources - Data sources.
 * @property {number} skiAreaCount - Number of ski areas this pass covers. Equal to the length of skiAreaIDs.
 * @property {string[]} skiAreaIDs - IDs of the ski areas this pass covers, sorted, so that the order does not depend on anything outside this array.
 * @property {SkiPassUnresolvedRosterEntry[]} unresolvedRosterEntries - Ski areas the source lists on this pass that could not be resolved to a ski area feature.
 */
export type SkiPass = {
  type: 'skiPass'
  id: SkiPassID
  name: string
  brandID: SkiPassBrandID | null
  brandName: string | null
  sources: Source[]
  skiAreaCount: number
  skiAreaIDs: string[]
  unresolvedRosterEntries: SkiPassUnresolvedRosterEntry[]
}

/** The complete non-geographic ski-pass dataset published alongside the ski-area data. */
export type SkiPassCatalog = {
  brands: SkiPassBrand[]
  passes: SkiPass[]
}

/**
 * A ski area listed on a pass by the source, which has no corresponding ski area feature.
 *
 * @property {string} name - Ski area name as written by the source.
 * @property {string} location - Location as written by the source, e.g. "U.S. - Colorado".
 * @property {string} reason - Why the entry could not be resolved.
 */
export type SkiPassUnresolvedRosterEntry = {
  name: string
  location: string
  reason: string
}
