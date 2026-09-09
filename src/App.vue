<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => !route.meta.public)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg-canvas">
    <RouterView class="flex flex-1 flex-col" />
    <BottomNav v-if="showNav" />
  </div>
</template>
