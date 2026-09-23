// The record form's player picker rules (DESIGN-SPEC.md §6 "Turn 4 revisions", 4b–4d), kept pure
// so they're testable without mounting anything.

export interface PickablePlayer {
  id: string
  name: string
  lastPlayedAt: string | null
}

/**
 * "Tonight, then recent": players from the current session come first, most recent first, then
 * everyone else by last played. Both halves are the same order, so this is simply last played,
 * newest first. Players who have never played go last, by name.
 */
export function orderForPicker<T extends PickablePlayer>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => {
    if (a.lastPlayedAt !== b.lastPlayedAt) {
      if (a.lastPlayedAt === null) return 1
      if (b.lastPlayedAt === null) return -1
      return b.lastPlayedAt.localeCompare(a.lastPlayedAt)
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * The grid shows two rows only (`capacity` tiles: 8 in the drawer, 10 on phones). When there are
 * more players than tiles, the last tile becomes "All +N" and N players are left out.
 */
export function pickerTiles<T>(players: readonly T[], capacity: number): { shown: T[]; hiddenCount: number } {
  if (players.length <= capacity) return { shown: [...players], hiddenCount: 0 }
  const shown = players.slice(0, capacity - 1)
  return { shown, hiddenCount: players.length - shown.length }
}

export interface PlayerMatch<T> {
  player: T
  /** The matched letters as [start, end) in the name; null for an empty query. */
  range: [number, number] | null
}

/**
 * The name filter (4c/4d): case-insensitive, anywhere in the name. Names that start with the query
 * come first, then the rest, each keeping the picker's order. An empty query lists everyone.
 */
export function matchPlayers<T extends { name: string }>(players: readonly T[], query: string): PlayerMatch<T>[] {
  const q = query.trim().toLowerCase()
  if (q === '') return players.map((player) => ({ player, range: null }))
  const prefix: PlayerMatch<T>[] = []
  const inner: PlayerMatch<T>[] = []
  for (const player of players) {
    const at = player.name.toLowerCase().indexOf(q)
    if (at === -1) continue
    ;(at === 0 ? prefix : inner).push({ player, range: [at, at + q.length] })
  }
  return [...prefix, ...inner]
}
