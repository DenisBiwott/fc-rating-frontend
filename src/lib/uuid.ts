/**
 * UUID v7 (RFC 9562): a 48-bit big-endian Unix ms timestamp, then version/variant bits, then
 * random. CLAUDE.md's non-negotiable calls for v7 specifically (matching the backend's own ID
 * scheme) even though the backend's Zod pattern for match ids actually accepts any version
 * 1-8 — `matches.sequence`, not the UUID, is what defines rating-replay order, so v7's
 * time-ordering isn't load-bearing here, just consistent.
 */
export function uuidv7(): string {
  const timestamp = BigInt(Date.now())
  const random = crypto.getRandomValues(new Uint8Array(10))
  const bytes = new Uint8Array(16)

  bytes[0] = Number((timestamp >> 40n) & 0xffn)
  bytes[1] = Number((timestamp >> 32n) & 0xffn)
  bytes[2] = Number((timestamp >> 24n) & 0xffn)
  bytes[3] = Number((timestamp >> 16n) & 0xffn)
  bytes[4] = Number((timestamp >> 8n) & 0xffn)
  bytes[5] = Number(timestamp & 0xffn)

  bytes[6] = 0x70 | (random[0]! & 0x0f) // version 7
  bytes[7] = random[1]!
  bytes[8] = 0x80 | (random[2]! & 0x3f) // variant 10
  bytes[9] = random[3]!
  bytes[10] = random[4]!
  bytes[11] = random[5]!
  bytes[12] = random[6]!
  bytes[13] = random[7]!
  bytes[14] = random[8]!
  bytes[15] = random[9]!

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
