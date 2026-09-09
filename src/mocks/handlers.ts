import { http, HttpResponse, type HttpHandler } from 'msw'
import * as db from './seed/mock-db'

// Minimal in-memory mock session. Any non-empty password logs in; there's no real password to
// match in mock mode.
let mockLoggedIn = false

const mockUser = { id: 'mock-admin', name: 'Admin', role: 'admin' as const }

export const handlers: HttpHandler[] = [
  http.get('*/auth/me', () => {
    if (!mockLoggedIn) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Unauthorized', status: 401 },
        { status: 401 },
      )
    }
    return HttpResponse.json({ user: mockUser })
  }),

  http.post('*/auth/login', async ({ request }) => {
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

  http.post('*/auth/logout', () => {
    mockLoggedIn = false
    return new HttpResponse(null, { status: 200 })
  }),

  http.get('*/players', () => HttpResponse.json(db.getPlayers())),

  http.get('*/leaderboard', () => HttpResponse.json(db.getLeaderboardResponse())),

  http.get('*/sessions/current', () => HttpResponse.json(db.getSessionCurrent())),

  http.get('*/sessions/:id', ({ params }) => {
    const summary = db.getSessionSummary(String(params.id))
    if (!summary) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Not Found', status: 404 },
        { status: 404 },
      )
    }
    return HttpResponse.json(summary)
  }),

  http.get('*/matches', ({ request }) => {
    const limit = Number(new URL(request.url).searchParams.get('limit') ?? '20')
    return HttpResponse.json({ items: db.getRecentMatches(limit), nextCursor: null })
  }),

  http.post('*/matches/preview', async ({ request }) => {
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

  http.post('*/matches', async ({ request }) => {
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
