import { createRouter, createWebHistory } from 'vue-router'
import { queryClient } from '@/api/query-client'
import { queueDesktopRecord } from '@/features/record-match/useRecordLauncher'
import { currentUserQueryOptions } from '@/queries/useCurrentUser'

declare module 'vue-router' {
  interface RouteMeta {
    /** Hides BottomNav — set on /login and the 404 catch-all, which aren't real app screens. */
    public?: boolean
    /** Requires a logged-in session. Unset routes are public reads. */
    requiresAuth?: boolean
    /** Hides the shell chrome (AccountBar + BottomNav) on a real app screen that needs the whole
     *  viewport — record-match, so the nav's green Record FAB can't compete with Confirm. */
    fullscreen?: boolean
    /** The widest layout this screen has been designed for (Turn 3 lands one screen at a time).
     *  App.vue caps the content column to 600px from the next breakpoint up: `phone` (default)
     *  caps from sm, `tablet` from lg; `desktop` only at the 1440px page cap. See
     *  docs/ARCHITECTURE.md#responsive-shell. */
    layout?: 'phone' | 'tablet' | 'desktop'
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'leaderboard',
      component: () => import('@/features/leaderboard/LeaderboardView.vue'),
      meta: { layout: 'desktop' },
    },
    {
      path: '/record',
      name: 'record-match',
      component: () => import('@/features/record-match/RecordMatchView.vue'),
      meta: { requiresAuth: true, fullscreen: true },
    },
    {
      path: '/players',
      name: 'players',
      component: () => import('@/features/players/PlayersView.vue'),
      meta: { layout: 'desktop' },
    },
    {
      path: '/players/:id',
      name: 'player-profile',
      component: () => import('@/features/players/PlayerProfileView.vue'),
      props: true,
      meta: { layout: 'desktop' },
    },
    {
      path: '/matches',
      name: 'match-history',
      component: () => import('@/features/sessions/MatchHistoryView.vue'),
    },
    {
      path: '/sessions',
      name: 'sessions',
      component: () => import('@/features/sessions/SessionsView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/features/admin/AdminView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

// Only record-match and admin require a session — everything else is a public read. Uses the
// shared queryClient so a repeat navigation reads the cache instead of refetching.
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const user = await queryClient.ensureQueryData(currentUserQueryOptions)
  if (!user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // On a desktop window, recording happens in the Record drawer over the leaderboard
  // (DESIGN-SPEC.md §6, 4b), not the full-screen /record route — carry any ?home= pre-fill across.
  if (to.name === 'record-match' && window.matchMedia('(min-width: 1024px)').matches) {
    queueDesktopRecord(typeof to.query.home === 'string' ? to.query.home : null)
    return { name: 'leaderboard' }
  }
  return true
})

export default router
