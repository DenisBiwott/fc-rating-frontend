import { http, HttpResponse, type HttpHandler } from 'msw'

// Minimal in-memory mock session — real seed data (players, matches, sessions) lands with the
// leaderboard handlers in Phase 2. Any non-empty password logs in; there's no real password to
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
]
