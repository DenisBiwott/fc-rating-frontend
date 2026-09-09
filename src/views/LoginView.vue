<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLogin } from '@/queries/useCurrentUser'

const password = ref('')
const login = useLogin()
const router = useRouter()
const route = useRoute()

async function handleSubmit(): Promise<void> {
  await login.mutateAsync(password.value)
  const redirect = route.query.redirect
  await router.push(typeof redirect === 'string' ? redirect : { name: 'leaderboard' })
}
</script>

<template>
  <section class="flex flex-1 flex-col justify-center gap-6 bg-bg-canvas p-5">
    <h1 class="text-2xl font-bold text-text-primary">FC Rating</h1>
    <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        class="h-14 rounded-2xl border border-border-default bg-bg-raised px-4 text-base text-text-primary outline-none focus:border-border-control"
      />
      <button
        type="submit"
        :disabled="!password || login.isPending.value"
        class="h-14 rounded-2xl bg-accent-up text-[17px] font-bold text-accent-up-ink shadow-[0_12px_30px_-12px_rgba(52,211,153,0.6)] disabled:opacity-50"
      >
        {{ login.isPending.value ? 'Logging in…' : 'Log in' }}
      </button>
      <p v-if="login.isError.value" class="text-sm text-accent-down" role="alert">
        {{ login.error.value?.message }}
      </p>
    </form>
  </section>
</template>
