/**
 * "Last played" as the roster and the desktop leaderboard show it: a 24h time for today, a short
 * date otherwise ("21:49", "Sep 5"). Local time, since both are read by people in the room.
 */
export function formatPlayedAt(iso: string, now: Date): string {
  const played = new Date(iso)
  const sameDay =
    played.getFullYear() === now.getFullYear() &&
    played.getMonth() === now.getMonth() &&
    played.getDate() === now.getDate()
  return sameDay
    ? played.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    : played.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** A join date as the profile hero and the roster's Joined column show it: "May 2026". */
export function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}
