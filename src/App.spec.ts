import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { queryClient } from '@/api/query-client'
import App from './App.vue'

// A minimal, unguarded router — the real router's auth guard hits the network, which this smoke
// test has no business exercising. It only proves App.vue's shell (RouterView + BottomNav) mounts.
const testRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'leaderboard', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
  ],
})

describe('App', () => {
  it('mounts the shell with a bottom nav', async () => {
    await testRouter.push('/')
    await testRouter.isReady()
    // AccountBar/BottomNav both read the current-user query (useIsAdmin), so this needs a real
    // QueryClient even though the test never asserts on login state — same setup
    // useRecordMatchForm.spec.ts already uses for the same reason.
    const wrapper = mount(App, {
      global: { plugins: [testRouter, [VueQueryPlugin, { queryClient }]] },
    })
    expect(wrapper.find('nav').exists()).toBe(true)
  })
})
