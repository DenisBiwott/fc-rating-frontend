import { createRouter, createWebHistory } from 'vue-router'
import { queryClient } from '@/api/query-client'
import { currentUserQueryOptions } from '@/queries/useCurrentUser'

declare module 'vue-router' {
  interface RouteMeta {
    /** Hides BottomNav — set on /login and the 404 catch-all, which aren't real app screens. */
    public?: boolean
    /** Requires a logged-in session. Unset routes are public reads. */
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'leaderboard',
      component: () => import('@/features/leaderboard/LeaderboardView.vue'),
    },
    {
      path: '/record',
      name: 'record-match',
      component: () => import('@/features/record-match/RecordMatchView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/players',
      name: 'players',
      component: () => import('@/features/players/PlayersView.vue'),
    },
    {
      path: '/players/:id',
      name: 'player-profile',
      component: () => import('@/features/players/PlayerProfileView.vue'),
      props: true,
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
  return true
})

export default router
