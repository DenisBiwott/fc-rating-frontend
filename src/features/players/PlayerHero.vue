<script setup lang="ts">
// The profile header block (DESIGN-SPEC.md PlayerHeader): avatar, RANK n OF m in medal colour,
// name, joined + matches, and the rating with tonight's delta. `large` is the desktop size (3c):
// avatar 76, name 34, rating 56.
import { computed } from 'vue'
import AvatarTile from '@/components/AvatarTile.vue'
import DeltaBadge from '@/components/DeltaBadge.vue'
import RatingNumber from '@/components/RatingNumber.vue'
import { medalFor, rankTextClass } from '@/features/leaderboard/medal'
import { formatJoined } from '@/lib/played-at'

const props = defineProps<{
  name: string
  rating: number
  createdAt: string
  gamesPlayed: number
  rank: number | null
  rankOf: number
  tonightDelta: number | null
  large?: boolean
}>()

const medal = computed(() => (props.rank === null ? undefined : medalFor(props.rank)))
const joined = computed(() => formatJoined(props.createdAt))
</script>

<template>
  <div class="flex items-center" :class="large ? 'gap-4.5' : 'gap-3.5'">
    <AvatarTile :name="name" :size="large ? 76 : 60" :medal="medal" />
    <div class="min-w-0 flex-1">
      <div
        v-if="rank !== null"
        class="font-mono font-semibold tracking-[0.14em]"
        :class="[large ? 'text-[11px]' : 'text-[10px]', rankTextClass(rank)]"
      >
        RANK {{ rank }} OF {{ rankOf }}
      </div>
      <div
        class="truncate font-bold tracking-[-0.02em] text-text-primary"
        :class="large ? 'text-[34px] leading-[1.1]' : 'mt-0.5 text-2xl'"
      >
        {{ name }}
      </div>
      <div class="mt-0.75 font-mono text-text-muted" :class="large ? 'text-xs' : 'text-[11px]'">
        joined {{ joined }} · {{ gamesPlayed }} matches
      </div>
    </div>
    <div class="flex-none text-right">
      <RatingNumber
        :value="rating"
        class="leading-none font-bold tracking-[-0.04em]"
        :class="large ? 'text-[56px]' : 'text-[40px]'"
      />
      <div v-if="tonightDelta !== null" class="mt-1 font-mono font-semibold" :class="large ? 'text-[13px]' : 'text-xs'">
        <DeltaBadge :value="tonightDelta" /> tonight
      </div>
    </div>
  </div>
</template>
