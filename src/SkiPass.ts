import { Source } from './Source'

/**
 * Stable identifier for a ski pass, e.g. "ikon".
 */
export type SkiPassID = string

/**
 * A ski area's membership of one tier of one ski pass.
 *
 * @property {SkiPassID} passID - Identifier of the ski pass.
 * @property {string} passName - Display name of the ski pass.
 * @property {string | null} tier - Tier within the pass, e.g. "base" or "session". Null for the pass's standard tier.
 * @property {string | null} access - Access code, copied verbatim from the source, e.g. "5, 26, 27" or "U". The source documents these per pass in free text, so they are not parsed.
 * @property {number | null} yearJoined - Year the ski area joined this pass, when the source records it.
 * @property {Source[]} sources - Data sources.
 */
export type SkiPassMembership = {
  passID: SkiPassID
  passName: string
  tier: string | null
  access: string | null
  yearJoined: number | null
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
 * @property {Source[]} sources - Data sources.
 * @property {number} skiAreaCount - Number of ski areas this pass covers. Equal to the length of skiAreaIDs.
 * @property {string[]} skiAreaIDs - IDs of the ski areas this pass covers, sorted, so that the order does not depend on anything outside this array.
 * @property {SkiPassUnresolvedRosterEntry[]} unresolvedRosterEntries - Ski areas the source lists on this pass that could not be resolved to a ski area feature.
 */
export type SkiPass = {
  type: 'skiPass'
  id: SkiPassID
  name: string
  sources: Source[]
  skiAreaCount: number
  skiAreaIDs: string[]
  unresolvedRosterEntries: SkiPassUnresolvedRosterEntry[]
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
