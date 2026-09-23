<script setup lang="ts">
// The /record route: the record form full screen, on phones and tablets (route meta `fullscreen`:
// no AccountBar/BottomNav, so the nav's green Record FAB can't outshine Confirm). On a desktop
// window the router guard sends /record to the leaderboard with the Record drawer open instead. `?home=`
// pre-fills the Home slot ("Record with {name}").
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecordMatchForm from './RecordMatchForm.vue'

const route = useRoute()
const router = useRouter()
const initialHome = computed(() => (typeof route.query.home === 'string' ? route.query.home : null))

function goToLeaderboard(): void {
  void router.push({ name: 'leaderboard' })
}
</script>

<template>
  <RecordMatchForm variant="screen" :initial-home-player-id="initialHome" @exit="goToLeaderboard" />
</template>
