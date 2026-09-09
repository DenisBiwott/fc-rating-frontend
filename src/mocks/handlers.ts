import { http, HttpResponse, type HttpHandler } from 'msw'
import { seedLeaderboardEntries, seedMeanRating, seedPlayers, seedSession } from './seed/leaderboard-seed'

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

  http.get('*/players', () => HttpResponse.json(seedPlayers)),

  http.get('*/leaderboard', () =>
    HttpResponse.json({ entries: seedLeaderboardEntries, meanRating: seedMeanRating }),
  ),

  http.get('*/sessions/current', () =>
    HttpResponse.json({
      id: seedSession.id,
      name: seedSession.name,
      startedAt: seedSession.startedAt,
      endedAt: seedSession.endedAt,
      createdBy: seedSession.createdBy,
    }),
  ),

  http.get('*/sessions/:id', ({ params }) => {
    if (params.id !== seedSession.id) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Not Found', status: 404 },
        { status: 404 },
      )
    }
    return HttpResponse.json({
      id: seedSession.id,
      name: seedSession.name,
      startedAt: seedSession.startedAt,
      endedAt: seedSession.endedAt,
      matchCount: seedSession.matchCount,
      playerDeltas: seedSession.playerDeltas,
      biggestMover: seedSession.biggestMover,
    })
  }),
]
