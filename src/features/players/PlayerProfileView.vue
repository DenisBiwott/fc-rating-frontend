<script setup lang="ts">
// FC Rating UI.dc.html §2a. Rank, "N of" total, and the session delta all come from the same
// useLeaderboard() row already fetched elsewhere in the app — leaderboard only includes active
// players, so a deactivated player's profile simply omits the rank badge and delta line (still a
// full historical record otherwise, per player-profile.ts's own comment on the backend).
import { computed, ref } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { useLeaderboard } from '@/queries/useLeaderboard'
import { usePlayerMatches } from '@/queries/usePlayerMatches'
import { usePlayerProfile } from '@/queries/usePlayerProfile'
import { useRatingHistory } from '@/queries/useRatingHistory'
import PlayerActionsSheet from './PlayerActionsSheet.vue'
import ProfileMatchRow from './ProfileMatchRow.vue'
import ProfileStatCard from './ProfileStatCard.vue'
import RatingSparkline from './RatingSparkline.vue'

const props = defineProps<{ id: string }>()

const actionsOpen = ref(false)

const { data: profile, isPending: profilePending } = usePlayerProfile(props.id)
const { data: leaderboard } = useLeaderboard()
const { data: history } = useRatingHistory(props.id)
const { data: matches, isPending: matchesPending } = usePlayerMatches(props.id, 20)

const leaderboardRow = computed(() => leaderboard.value?.rows.find((r) => r.playerId === props.id))

const medal = computed<'gold' | 'silver' | 'bronze' | undefined>(() => {
  const rank = leaderboardRow.value?.rank
  return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : undefined
})

const joinedLabel = computed(() =>
  profile.value
    ? new Date(profile.value.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : '',
)

const winPct = computed(() => {
  if (!profile.value) return 0
  const total = profile.value.wins + profile.value.draws + profile.value.losses
  return total === 0 ? 0 : Math.round((profile.value.wins / total) * 100)
})

const goalDiff = computed(() => (profile.value ? profile.value.goalsFor - profile.value.goalsAgainst : 0))
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0">
    <template v-if="profile">
      <header class="flex items-center justify-between px-5 pt-3.5 pb-2">
        <RouterLink :to="{ name: 'leaderboard' }" class="text-[15px] text-text-secondary">
          &lsaquo; Table
        </RouterLink>
        <span class="font-mono text-[11px] tracking-[0.1em] text-text-faint">PLAYER</span>
        <button
          type="button"
          aria-label="Player actions"
          class="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-raised text-sm text-text-secondary"
          @click="actionsOpen = true"
        >
          ···
        </button>
      </header>

      <div class="flex items-center gap-3.5 px-5 pb-4">
        <AvatarTile :name="profile.name" :size="60" :medal="medal" />
        <div class="min-w-0 flex-1">
          <div
            v-if="leaderboardRow"
            class="font-mono text-[10px] font-semibold tracking-[0.14em]"
            :class="medal ? 'text-medal-gold' : 'text-text-secondary'"
          >
            RANK {{ leaderboardRow.rank }} OF {{ leaderboard?.rows.length }}
          </div>
          <div class="mt-0.5 truncate text-2xl font-bold tracking-[-0.02em] text-text-primary">
            {{ profile.name }}
          </div>
          <div class="mt-0.75 font-mono text-[11px] text-text-muted">
            joined {{ joinedLabel }} · {{ profile.gamesPlayed }} matches
          </div>
        </div>
        <div class="flex-none text-right">
          <RatingNumber :value="profile.rating" class="text-[40px] font-bold tracking-[-0.04em]" />
          <div v-if="leaderboardRow?.deltaSinceLastSession != null" class="mt-0.5 font-mono text-xs font-semibold">
            <DeltaBadge :value="leaderboardRow.deltaSinceLastSession" /> tonight
          </div>
        </div>
      </div>

      <RatingSparkline :history="history ?? []" />

      <div class="grid grid-cols-3 gap-2 px-5 pb-3.5">
        <ProfileStatCard
          label="RECORD"
          :value="`${profile.wins}-${profile.losses}-${profile.draws}`"
          :sub-label="`${winPct}% win`"
          :sub-label-class="
            profile.gamesPlayed === 0
              ? 'text-text-muted'
              : winPct > 50
                ? 'text-accent-up'
                : winPct < 50
                  ? 'text-accent-down'
                  : 'text-text-muted'
          "
        />
        <ProfileStatCard
          label="STREAK"
          :value="profile.streak ? `${profile.streak.length} ${profile.streak.result}` : '—'"
          :value-class="
            profile.streak?.result === 'W'
              ? 'text-accent-up-bright'
              : profile.streak?.result === 'L'
                ? 'text-accent-down'
                : 'text-text-primary'
          "
          :sub-label="profile.bestStreak ? `best ${profile.bestStreak.length} ${profile.bestStreak.result}` : 'no streak yet'"
        />
        <ProfileStatCard
          label="GOALS"
          :value="`${profile.goalsFor}:${profile.goalsAgainst}`"
          :sub-label="goalDiff === 0 ? 'even' : `${goalDiff > 0 ? '+' : ''}${goalDiff} diff`"
          :sub-label-class="goalDiff > 0 ? 'text-accent-up' : goalDiff < 0 ? 'text-accent-down' : 'text-text-muted'"
        />
      </div>

      <div class="flex items-center justify-between px-5 pb-2">
        <span class="font-mono text-[10px] tracking-[0.14em] text-text-faint">MATCHES · NEWEST FIRST</span>
        <span class="font-mono text-[10px] text-text-faint">{{ profile.gamesPlayed }}</span>
      </div>

      <div v-if="!matchesPending && matches?.length === 0" class="px-5 pb-6 font-mono text-xs text-text-muted">
        No matches yet.
      </div>
      <ProfileMatchRow v-for="match in matches" :key="match.matchId" :match="match" />
    </template>

    <p v-else-if="profilePending" class="p-5 font-mono text-sm text-text-muted">Loading…</p>
    <p v-else class="p-5 font-mono text-sm text-text-muted">Player not found.</p>

    <!-- Kept inside this single root element deliberately: a second root node here would disable
         Vue's automatic attrs fallthrough, silently dropping the overflow-y-auto/flex-1 classes
         RouterView passes down and breaking the whole view's scrolling. PlayerActionsSheet's
         visible content teleports via DialogPortal regardless of where it sits in this template. -->
    <PlayerActionsSheet
      v-if="profile"
      v-model:open="actionsOpen"
      :player-id="id"
      :name="profile.name"
      :rank="leaderboardRow?.rank ?? null"
      :games-played="profile.gamesPlayed"
    />
  </section>
</template>
