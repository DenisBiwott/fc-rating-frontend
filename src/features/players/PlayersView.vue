<script setup lang="ts">
// FC Rating UI.dc.html §2b/2c (phone/tablet) and 3d (desktop).
//   - Phone/tablet: tappable rows (PlayerRosterRow), Active/Inactive toggle, "+ Add" opens a sheet.
//   - Desktop: the roster table with a ··· menu per row (Rename…, Deactivate/Reactivate, Delete…),
//     a segmented Active/Inactive control, and "+ Add player" anchoring the add popover. Capped at
//     1180px (DESIGN-SPEC.md §6).
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIsDesktop } from '@/composables/useBreakpoint'
import { useIsAdmin } from '@/queries/useCurrentUser'
import { usePlayersRoster, type RosterPlayer } from '@/queries/usePlayersRoster'
import { useUpdatePlayer } from '@/queries/useUpdatePlayer'
import AddPlayerPopover from './AddPlayerPopover.vue'
import AddPlayerSheet from './AddPlayerSheet.vue'
import PlayerActionsSheet from './PlayerActionsSheet.vue'
import PlayerRosterRow from './PlayerRosterRow.vue'
import RosterTable from './RosterTable.vue'

const showActive = ref(true)
const addPlayerOpen = ref(false)

const { data: activePlayers } = usePlayersRoster(true)
const { data: inactivePlayers } = usePlayersRoster(false)

const players = computed(() => (showActive.value ? activePlayers.value : inactivePlayers.value))
const activeCount = computed(() => activePlayers.value?.length ?? 0)
const inactiveCount = computed(() => inactivePlayers.value?.length ?? 0)
const emptyLabel = computed(() => `No ${showActive.value ? 'active' : 'inactive'} players.`)

const isAdmin = useIsAdmin()
const isDesktop = useIsDesktop()
const route = useRoute()
const router = useRouter()

function goToLogin(): void {
  void router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function handleAddClick(): void {
  if (isAdmin.value) addPlayerOpen.value = true
  else goToLogin()
}

// Desktop row menus. Rename/Delete open the actions dialog straight at that step (as on the 3c
// profile); Deactivate/Reactivate run directly.
const actionsTarget = ref<RosterPlayer | null>(null)
const actionsMode = ref<'rename' | 'confirm-delete'>('rename')
const actionsOpen = computed({
  get: () => actionsTarget.value !== null,
  set: (isOpen) => {
    if (!isOpen) actionsTarget.value = null
  },
})
function openActions(player: RosterPlayer, mode: 'rename' | 'confirm-delete'): void {
  actionsMode.value = mode
  actionsTarget.value = player
}
const updatePlayer = useUpdatePlayer()
function setActive(player: RosterPlayer, isActive: boolean): void {
  updatePlayer.mutate({ id: player.id, isActive })
}
</script>

<template>
  <section class="flex h-full flex-none flex-col *:shrink-0">
    <!-- Desktop (3d) -->
    <div v-if="isDesktop" class="flex w-full max-w-[1180px] flex-col gap-5 px-8 pt-7.5 pb-7">
      <header class="flex items-end justify-between gap-5">
        <div>
          <h1 class="text-[30px] font-bold tracking-[-0.02em] text-text-primary">Players</h1>
          <div class="mt-0.75 text-[13px] text-text-muted">{{ activeCount }} active · {{ inactiveCount }} inactive</div>
        </div>
        <div class="flex items-center gap-2.5">
          <span v-if="updatePlayer.isError.value" role="alert" class="font-mono text-[11px] text-text-down">
            Could not update player.
          </span>
          <div class="flex gap-1 rounded-[11px] border border-border-default p-0.75" role="group" aria-label="Show players">
            <button
              v-for="option in [
                { active: true, label: 'Active' },
                { active: false, label: 'Inactive' },
              ]"
              :key="option.label"
              type="button"
              class="h-8 rounded-lg px-4 text-[13px]"
              :class="
                showActive === option.active
                  ? 'bg-bg-control font-semibold text-text-primary'
                  : 'font-medium text-text-muted hover:text-text-secondary'
              "
              :aria-pressed="showActive === option.active"
              @click="showActive = option.active"
            >
              {{ option.label }}
            </button>
          </div>
          <AddPlayerPopover v-if="isAdmin" v-model:open="addPlayerOpen">
            <button
              type="button"
              class="h-10 rounded-[11px] bg-accent-up px-4 text-sm font-bold text-accent-up-ink"
              :class="addPlayerOpen ? 'shadow-[0_0_0_3px_rgba(52,211,153,0.18)]' : ''"
            >
              + Add player
            </button>
          </AddPlayerPopover>
          <button
            v-else
            type="button"
            class="h-10 rounded-[11px] bg-accent-up px-4 text-sm font-bold text-accent-up-ink opacity-40"
            @click="goToLogin"
          >
            + Add player
          </button>
        </div>
      </header>

      <RosterTable
        :players="players ?? []"
        :empty-label="emptyLabel"
        :is-admin="isAdmin"
        :busy="updatePlayer.isPending.value"
        @rename="openActions($event, 'rename')"
        @set-active="setActive"
        @delete="openActions($event, 'confirm-delete')"
        @login="goToLogin"
      />
    </div>

    <!-- Phone / tablet (2b) -->
    <template v-else>
      <header class="flex items-end justify-between px-5 pt-3.5 pb-3.5 sm:px-8">
        <div>
          <h1 class="text-[26px] font-bold tracking-[-0.02em] text-text-primary">Players</h1>
          <div class="mt-0.5 text-[13px] text-text-muted">{{ activeCount }} active · {{ inactiveCount }} inactive</div>
        </div>
        <button
          type="button"
          class="h-9 rounded-[10px] bg-accent-up px-3.5 text-sm font-bold text-accent-up-ink"
          :class="isAdmin ? '' : 'opacity-40'"
          @click="handleAddClick"
        >
          + Add
        </button>
      </header>

      <div class="flex gap-1.5 px-5 pb-3.5 sm:px-8">
        <button
          v-for="option in [
            { active: true, label: 'Active' },
            { active: false, label: 'Inactive' },
          ]"
          :key="option.label"
          type="button"
          class="h-8.5 flex-1 rounded-[9px] text-[13px]"
          :class="
            showActive === option.active
              ? 'border border-border-control bg-bg-control font-semibold text-text-primary'
              : 'border border-border-hairline font-medium text-text-muted'
          "
          :aria-pressed="showActive === option.active"
          @click="showActive = option.active"
        >
          {{ option.label }}
        </button>
      </div>

      <PlayerRosterRow v-for="player in players" :key="player.id" :player="player" />
      <p v-if="players?.length === 0" class="px-5 py-6 font-mono text-sm text-text-muted sm:px-8">
        {{ emptyLabel }}
      </p>
    </template>

    <!-- Kept inside this single root element deliberately: a second root node here would disable
         Vue's automatic attrs fallthrough, silently dropping the overflow-y-auto/flex-1 classes
         RouterView passes down and breaking the whole view's scrolling. The sheets' visible
         content teleports via DialogPortal regardless of where it sits in this template. -->
    <AddPlayerSheet v-if="!isDesktop" v-model:open="addPlayerOpen" />
    <PlayerActionsSheet
      v-if="actionsTarget"
      v-model:open="actionsOpen"
      :player-id="actionsTarget.id"
      :name="actionsTarget.name"
      :rank="actionsTarget.rank"
      :games-played="actionsTarget.gamesPlayed ?? 0"
      :initial-mode="actionsMode"
    />
  </section>
</template>
