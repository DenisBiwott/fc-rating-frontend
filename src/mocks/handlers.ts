import { http, HttpResponse, type HttpHandler } from 'msw'
import * as db from './seed/mock-db'

// Minimal in-memory mock session. Any non-empty password logs in; there's no real password to
// match in mock mode.
let mockLoggedIn = false

const mockUser = { id: 'mock-admin', name: 'Admin', role: 'admin' as const }

// Anchor every handler to the API's own base URL (the same one apiClient uses), never a bare `*/`
// wildcard. The Service Worker sees every request the page makes, including Vite's module URLs:
// `*/players/:id` also matched `/src/features/players/PlayerProfileView.vue` and answered it with
// a "player not found" 404, so the profile route could never load in mock mode.
const API = import.meta.env.VITE_API_BASE ?? ''

export const handlers: HttpHandler[] = [
  http.get(`${API}/auth/me`, () => {
    if (!mockLoggedIn) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Unauthorized', status: 401 },
        { status: 401 },
      )
    }
    return HttpResponse.json({ user: mockUser })
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { password?: string }
    if (!body.password) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Bad Request', status: 400 },
        { status: 400 },
      )
    }
    mockLoggedIn = true
    return HttpResponse.json({ user: mockUser })
  }),

  http.post(`${API}/auth/logout`, () => {
    mockLoggedIn = false
    return new HttpResponse(null, { status: 200 })
  }),

  http.get(`${API}/players`, ({ request }) => {
    const active = new URL(request.url).searchParams.get('active')
    return HttpResponse.json(db.getPlayers(active === null ? undefined : active === 'true'))
  }),

  http.post(`${API}/players`, async ({ request }) => {
    const body = (await request.json()) as { name: string }
    const player = db.createPlayer(body.name)
    return player
      ? HttpResponse.json(player, { status: 201 })
      : HttpResponse.json({ type: 'about:blank', title: 'Conflict', status: 409 }, { status: 409 })
  }),

  http.patch(`${API}/players/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; isActive?: boolean }
    const result = db.updatePlayer(String(params.id), body)
    if (result === 'not-found') return HttpResponse.json({ type: 'about:blank', title: 'Not Found', status: 404 }, { status: 404 })
    if (result === 'conflict') return HttpResponse.json({ type: 'about:blank', title: 'Conflict', status: 409 }, { status: 409 })
    return HttpResponse.json(result)
  }),

  http.delete(`${API}/players/:id`, ({ params }) => {
    const result = db.deletePlayer(String(params.id))
    if (result === 'not-found') return HttpResponse.json({ type: 'about:blank', title: 'Not Found', status: 404 }, { status: 404 })
    if (result === 'conflict') return HttpResponse.json({ type: 'about:blank', title: 'Conflict', status: 409 }, { status: 409 })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/players/:id`, ({ params }) => {
    const profile = db.getPlayerProfile(String(params.id))
    return profile
      ? HttpResponse.json(profile)
      : HttpResponse.json({ type: 'about:blank', title: 'Not Found', status: 404 }, { status: 404 })
  }),

  http.get(`${API}/players/:id/rating-history`, ({ params }) => HttpResponse.json(db.getRatingHistory(String(params.id)))),

  http.get(`${API}/sessions`, () => HttpResponse.json(db.getSessions())),

  http.get(`${API}/leaderboard`, () => HttpResponse.json(db.getLeaderboardResponse())),

  http.get(`${API}/sessions/current`, () => HttpResponse.json(db.getSessionCurrent())),

  http.get(`${API}/sessions/:id`, ({ params }) => {
    const summary = db.getSessionSummary(String(params.id))
    if (!summary) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Not Found', status: 404 },
        { status: 404 },
      )
    }
    return HttpResponse.json(summary)
  }),

  http.get(`${API}/matches`, ({ request }) => {
    const query = new URL(request.url).searchParams
    const limit = Number(query.get('limit') ?? '20')
    const playerId = query.get('playerId')
    if (playerId) {
      const cursor = query.get('cursor')
      return HttpResponse.json(db.getPlayerMatches(playerId, limit, cursor === null ? null : Number(cursor)))
    }
    return HttpResponse.json({ items: db.getRecentMatches(limit), nextCursor: null })
  }),

  http.post(`${API}/matches/preview`, async ({ request }) => {
    const body = (await request.json()) as {
      homePlayerId: string
      awayPlayerId: string
      homeScore: number
      awayScore: number
    }
    const outcome = db.previewMatch(body.homePlayerId, body.awayPlayerId, body.homeScore, body.awayScore)
    if (!outcome) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Unknown player', status: 422 },
        { status: 422 },
      )
    }
    return HttpResponse.json(outcome)
  }),

  http.post(`${API}/matches`, async ({ request }) => {
    const body = (await request.json()) as {
      id: string
      homePlayerId: string
      awayPlayerId: string
      homeScore: number
      awayScore: number
      decidedOnPenalties?: boolean
      sessionId?: string
    }
    try {
      const result = db.recordMatch(
        body.id,
        body.homePlayerId,
        body.awayPlayerId,
        body.homeScore,
        body.awayScore,
        body.decidedOnPenalties ?? false,
      )
      return HttpResponse.json(result)
    } catch {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Unknown player', status: 422 },
        { status: 422 },
      )
    }
  }),
]
