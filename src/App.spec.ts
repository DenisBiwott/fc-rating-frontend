import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'

// A minimal, unguarded router — the real router's auth guard hits the network, which this smoke
// test has no business exercising. It only proves App.vue's shell (RouterView + BottomNav) mounts.
const testRouter = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'leaderboard', component: { template: '<div>Home</div>' } }],
})

describe('App', () => {
  it('mounts the shell with a bottom nav', async () => {
    await testRouter.push('/')
    await testRouter.isReady()
    const wrapper = mount(App, { global: { plugins: [testRouter] } })
    expect(wrapper.find('nav').exists()).toBe(true)
  })
})
