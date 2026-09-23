<script setup lang="ts">
// Player profile (DESIGN-SPEC.md 2a / 3c). Third-person throughout; there's no "you" state.
//   - Phone/tablet (2a): one scrolling column — hero, sparkline, stat tiles, match list.
//   - Desktop (3c): "‹ Leaderboard" + Record with {name} + ··· menu, then two columns: 460px of
//     hero, stat tiles and the axis chart, beside the full match-history table.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIsDesktop } from '@/composables/useBreakpoint'
import { useRecordLauncher } from '@/features/record-match/useRecordLauncher'
import { useIsAdmin } from '@/queries/useCurrentUser'
import { useLeaderboard } from '@/queries/useLeaderboard'
import { usePlayerMatches, type PlayerMatchRow } from '@/queries/usePlayerMatches'
import { usePlayerProfile } from '@/queries/usePlayerProfile'
import { useRatingHistory } from '@/queries/useRatingHistory'
import { useUpdatePlayer } from '@/queries/useUpdatePlayer'
import PlayerActionsSheet from './PlayerActionsSheet.vue'
import PlayerHero from './PlayerHero.vue'
import ProfileMatchRow from './ProfileMatchRow.vue'
import ProfileMatchTable from './ProfileMatchTable.vue'
import ProfileStats from './ProfileStats.vue'
import RatingChart from './RatingChart.vue'
import RatingSparkline from './RatingSparkline.vue'
import VoidMatchSheet from './VoidMatchSheet.vue'

const props = defineProps<{ id: string }>()

const isAdmin = useIsAdmin()
const isDesktop = useIsDesktop()
const { openRecord } = useRecordLauncher()
const route = useRoute()
const router = useRouter()

const { data: profile, isPending: profilePending } = usePlayerProfile(props.id)
const { data: leaderboard } = useLeaderboard()
const { data: history } = useRatingHistory(props.id)
const matches = usePlayerMatches(props.id)

const leaderboardRow = computed(() => leaderboard.value?.rows.find((r) => r.playerId === props.id))
const heroProps = computed(() =>
  profile.value
    ? {
        name: profile.value.name,
        rating: profile.value.rating,
        createdAt: profile.value.createdAt,
        gamesPlayed: profile.value.gamesPlayed,
        rank: leaderboardRow.value?.rank ?? null,
        rankOf: leaderboard.value?.rows.length ?? 0,
        tonightDelta: leaderboardRow.value?.deltaSinceLastSession ?? null,
      }
    : null,
)

// Player actions. Phone/tablet: the ··· opens the actions sheet at its menu. Desktop: a dropdown
// (DESIGN-SPEC.md PlayerActions: "Mobile sheet, desktop menu") whose Rename/Delete open that same
// sheet — a centred dialog at this width — straight at the step; Deactivate (Reactivate for an
// inactive player) runs directly, as the sheet's Deactivate button does. Anonymous visitors get a muted ··· that leads to login.
const actionsOpen = ref(false)
const actionsMode = ref<'menu' | 'rename' | 'confirm-delete'>('menu')
function openActions(mode: 'menu' | 'rename' | 'confirm-delete'): void {
  actionsMode.value = mode
  actionsOpen.value = true
}
function goToLogin(): void {
  void router.push({ name: 'login', query: { redirect: route.fullPath } })
}
function handleActionsClick(): void {
  if (isAdmin.value) openActions('menu')
  else goToLogin()
}
const updatePlayer = useUpdatePlayer()
function setActive(isActive: boolean): void {
  updatePlayer.mutate({ id: props.id, isActive })
}

// One shared void sheet for the whole match list; voidTarget holds which match is being voided.
const voidTarget = ref<PlayerMatchRow | null>(null)
const voidSheetOpen = computed({
  get: () => voidTarget.value !== null,
  set: (isOpen) => {
    if (!isOpen) voidTarget.value = null
  },
})
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0">
    <template v-if="profile && heroProps">
      <!-- Desktop (3c) -->
      <div v-if="isDesktop" class="flex h-full flex-col gap-5.5 px-8 pt-6.5 pb-7 *:shrink-0">
        <header class="flex items-center justify-between gap-4">
          <RouterLink :to="{ name: 'leaderboard' }" class="text-sm text-text-secondary hover:text-text-primary">
            &lsaquo; Leaderboard
          </RouterLink>
          <div class="flex items-center gap-2">
            <span v-if="updatePlayer.isError.value" role="alert" class="font-mono text-[11px] text-text-down">
              Could not update player.
            </span>
            <button
              v-if="isAdmin && profile.isActive"
              type="button"
              class="h-9 rounded-[10px] border border-border-default px-3.5 text-[13px] font-semibold whitespace-nowrap text-text-emphasis hover:bg-bg-raised"
              @click="openRecord(profile.playerId)"
            >
              Record with {{ profile.name }}
            </button>
            <DropdownMenu v-if="isAdmin">
              <DropdownMenuTrigger
                aria-label="Player actions"
                class="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border-default text-[15px] text-text-secondary hover:bg-bg-raised"
              >
                ···
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem @select="openActions('rename')">Rename…</DropdownMenuItem>
                <DropdownMenuItem :disabled="updatePlayer.isPending.value" @select="setActive(!profile.isActive)">
                  {{ profile.isActive ? 'Deactivate' : 'Reactivate' }}
                </DropdownMenuItem>
                <DropdownMenuItem destructive :disabled="profile.gamesPlayed > 0" @select="openActions('confirm-delete')">
                  Delete player…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              v-else
              type="button"
              aria-label="Player actions"
              class="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border-default text-[15px] text-text-secondary opacity-40"
              @click="goToLogin"
            >
              ···
            </button>
          </div>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-[460px_minmax(0,1fr)] gap-7">
          <div class="flex min-h-0 flex-col gap-4.5 overflow-y-auto">
            <PlayerHero v-bind="heroProps" large />
            <ProfileStats
              large
              :wins="profile.wins"
              :losses="profile.losses"
              :draws="profile.draws"
              :games-played="profile.gamesPlayed"
              :streak="profile.streak"
              :best-streak="profile.bestStreak"
              :goals-for="profile.goalsFor"
              :goals-against="profile.goalsAgainst"
            />
            <RatingChart :history="history ?? []" />
          </div>
          <ProfileMatchTable
            :rows="matches.rows.value"
            :total="profile.gamesPlayed"
            :is-admin="isAdmin"
            :has-more="matches.hasNextPage.value"
            :loading-more="matches.isFetchingNextPage.value"
            @void="voidTarget = $event"
            @load-more="matches.fetchNextPage()"
          />
        </div>
      </div>

      <!-- Phone / tablet (2a) -->
      <template v-else>
        <header class="flex items-center justify-between px-5 pt-3.5 pb-2 sm:px-8">
          <RouterLink :to="{ name: 'leaderboard' }" class="text-[15px] text-text-secondary">&lsaquo; Table</RouterLink>
          <span class="font-mono text-[11px] tracking-[0.1em] text-text-faint">PLAYER</span>
          <button
            type="button"
            aria-label="Player actions"
            class="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-raised text-sm text-text-secondary"
            :class="isAdmin ? '' : 'opacity-40'"
            @click="handleActionsClick"
          >
            ···
          </button>
        </header>
        <PlayerHero v-bind="heroProps" class="px-5 pb-4 sm:px-8" />
        <RatingSparkline :history="history ?? []" />
        <ProfileStats
          class="px-5 pb-3.5 sm:px-8"
          :wins="profile.wins"
          :losses="profile.losses"
          :draws="profile.draws"
          :games-played="profile.gamesPlayed"
          :streak="profile.streak"
          :best-streak="profile.bestStreak"
          :goals-for="profile.goalsFor"
          :goals-against="profile.goalsAgainst"
        />
        <div class="flex items-center justify-between px-5 pb-2 sm:px-8">
          <span class="font-mono text-[10px] tracking-[0.14em] text-text-faint">MATCHES · NEWEST FIRST</span>
          <span class="font-mono text-[10px] text-text-faint">{{ profile.gamesPlayed }}</span>
        </div>
        <div
          v-if="!matches.isPending.value && matches.rows.value.length === 0"
          class="px-5 pb-6 font-mono text-xs text-text-muted sm:px-8"
        >
          No matches yet.
        </div>
        <ProfileMatchRow
          v-for="match in matches.rows.value"
          :key="match.matchId"
          :match="match"
          @void="voidTarget = $event"
        />
        <div v-if="matches.hasNextPage.value" class="border-t border-border-hairline px-5 py-3 text-center sm:px-8">
          <button
            type="button"
            class="h-11 px-4 font-mono text-[11px] text-text-secondary disabled:opacity-50"
            :disabled="matches.isFetchingNextPage.value"
            @click="matches.fetchNextPage()"
          >
            {{ matches.isFetchingNextPage.value ? 'Loading…' : 'Load older matches' }}
          </button>
        </div>
      </template>
    </template>
    <p v-else-if="profilePending" class="p-5 font-mono text-sm text-text-muted sm:px-8">Loading…</p>
    <p v-else class="p-5 font-mono text-sm text-text-muted sm:px-8">Player not found.</p>

    <!-- Kept inside this single root element deliberately: a second root node here would disable
         Vue's automatic attrs fallthrough, silently dropping the overflow-y-auto/flex-1 classes
         RouterView passes down and breaking the whole view's scrolling. The sheets' visible content
         teleports via DialogPortal regardless of where they sit in this template. -->
    <PlayerActionsSheet
      v-if="profile"
      v-model:open="actionsOpen"
      :player-id="id"
      :name="profile.name"
      :rank="leaderboardRow?.rank ?? null"
      :games-played="profile.gamesPlayed"
      :initial-mode="actionsMode"
    />
    <VoidMatchSheet
      v-if="voidTarget"
      v-model:open="voidSheetOpen"
      :match-id="voidTarget.matchId"
      :opponent-name="voidTarget.opponentName"
      :self-score="voidTarget.selfScore"
      :opponent-score="voidTarget.opponentScore"
    />
  </section>
</template>
