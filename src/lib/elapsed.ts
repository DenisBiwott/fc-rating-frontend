/** `date` moved by whole calendar months, clamping the day (Jan 31 + 1 month → Feb 28/29). */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const day = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(day, lastDayOfMonth))
  return result
}

function twoUnits(major: number, majorUnit: string, minor: number, minorUnit: string): string {
  return minor > 0 ? `${major}${majorUnit} ${minor}${minorUnit}` : `${major}${majorUnit}`
}

/**
 * Compact elapsed time, the two largest units: `42m`, `3h 12m`, `5d 4h`, `2mo 3d`, `1y 2mo`.
 * Months and years are calendar months (not 30-day blocks), so a session opened on the 14th
 * reads a whole month on the 14th of the next. The app runs one long-lived session, so the
 * larger units are the common case, not an edge case.
 */
export function formatElapsed(start: Date, now: Date): string {
  if (now.getTime() <= start.getTime()) return '0m'

  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (addMonths(start, months).getTime() > now.getTime()) months -= 1

  const totalMinutes = Math.floor((now.getTime() - addMonths(start, months).getTime()) / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (months >= 12) return twoUnits(Math.floor(months / 12), 'y', months % 12, 'mo')
  if (months > 0) return twoUnits(months, 'mo', days, 'd')
  if (days > 0) return twoUnits(days, 'd', hours, 'h')
  if (hours > 0) return twoUnits(hours, 'h', minutes, 'm')
  return `${minutes}m`
}
