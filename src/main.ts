import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import { queryClient } from './api/query-client'
import App from './App.vue'
import router from './router'
import './styles/main.css'

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createApp(App).use(VueQueryPlugin, { queryClient }).use(router).mount('#app')
})
