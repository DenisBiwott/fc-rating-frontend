<script setup lang="ts">
// DESIGN-SPEC.md §6 "Desktop console" and Turn 3's 3a: an 88px bg/nav rail at lg and up, replacing
// both BottomNav and AccountBar there. Top to bottom: FC mark · Record (52px green, radius 16) ·
// divider · Table · Players · spacer · account controls · TV. Active item gets a bg/control fill.
// This component owns its breakpoint (hidden below lg), mirroring BottomNav's lg:hidden.
//
// Not here yet, by slice: the `R` key hint under Record waits for keyboard shortcuts (a hint with
// no working key would mislead), and TV is inert until the /tv route exists.
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import NavIcon from '@/components/NavIcon.vue'
import { useAccount } from '@/composables/useAccount'

const { user, isPending, isAdmin, nextTheme, toggleTheme, logOut } = useAccount()
const route = useRoute()
const tableActive = computed(() => route.name === 'leaderboard')
const playersActive = computed(() => route.name === 'players' || route.name === 'player-profile')

const itemClass = 'flex w-16 flex-col items-center gap-[5px] rounded-xl py-2.5 text-[10px] font-semibold'
const accountClass =
  'flex h-11 w-16 items-center justify-center rounded-xl font-mono text-[10px] font-semibold tracking-[0.04em] text-text-secondary hover:bg-bg-control'
</script>

<template>
  <nav
    aria-label="Primary"
    class="hidden w-22 flex-none flex-col items-center gap-5 border-r border-border-nav bg-bg-nav py-[22px] lg:flex"
  >
    <span class="font-mono text-[13px] font-bold tracking-[0.1em] text-text-primary">FC</span>

    <RouterLink
      to="/record"
      aria-label="Record match"
      class="flex flex-col items-center gap-1.5 rounded-2xl"
      :class="isAdmin ? '' : 'opacity-40'"
    >
      <span
        class="flex h-13 w-13 items-center justify-center rounded-2xl bg-accent-up text-2xl font-bold text-accent-up-ink"
        :class="isAdmin ? 'shadow-[0_10px_28px_-8px_rgba(52,211,153,0.55)]' : ''"
        aria-hidden="true"
      >
        +
      </span>
      <span class="text-[10px] font-bold tracking-[0.06em] text-text-up-bright" aria-hidden="true">RECORD</span>
    </RouterLink>

    <span class="h-px w-10 bg-border-nav" aria-hidden="true" />

    <RouterLink
      to="/"
      :class="[itemClass, tableActive ? 'bg-bg-control text-text-primary' : 'text-text-nav-inactive hover:bg-bg-control']"
      :aria-current="tableActive ? 'page' : undefined"
    >
      <NavIcon name="table" />
      Table
    </RouterLink>

    <RouterLink
      to="/players"
      :class="[itemClass, playersActive ? 'bg-bg-control text-text-primary' : 'text-text-nav-inactive hover:bg-bg-control']"
      :aria-current="playersActive ? 'page' : undefined"
    >
      <NavIcon name="players" />
      Players
    </RouterLink>

    <div class="flex-1" />

    <div v-if="!isPending" class="flex flex-col items-center gap-1">
      <button type="button" :class="accountClass" :aria-label="`Switch to ${nextTheme} theme`" @click="toggleTheme">
        {{ nextTheme === 'light' ? 'Light' : 'Dark' }}
      </button>
      <RouterLink v-if="!isAdmin" :to="{ name: 'login' }" :class="accountClass">Log in</RouterLink>
      <button
        v-else
        type="button"
        :class="accountClass"
        :title="user ? `Signed in as ${user.name}` : undefined"
        @click="logOut"
      >
        Log out
      </button>
    </div>

    <span
      :class="[itemClass, 'cursor-not-allowed text-text-nav-inactive opacity-40']"
      aria-disabled="true"
      title="TV mode — coming soon"
    >
      <NavIcon name="tv" />
      TV
    </span>
  </nav>
</template>
