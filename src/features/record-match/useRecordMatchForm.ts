// The record-match state machine (docs/ARCHITECTURE.md#the-record-match-state-machine):
// selecting -> scoring -> submitting -> result -> done. This is the one piece of client state in
// the app outside the theme composable (CLAUDE.md's non-negotiable) — held here as one composable
// rather than scattered across component refs.
import { computed, ref, watch } from 'vue'
import { apiClient } from '@/api/client'
import { queryClient } from '@/api/query-client'
import { uuidv7 } from '@/lib/uuid'
import { currentSessionQueryOptions } from '@/queries/useCurrentSession'
import { useMatchPreview } from '@/queries/useMatchPreview'
import { useRecordMatch } from '@/queries/useRecordMatch'

export type FormState = 'selecting' | 'scoring' | 'submitting' | 'result' | 'done'

const MAX_SCORE = 20
const PREVIEW_DEBOUNCE_MS = 150

export interface ResultSessionContext {
  name: string
  matchCount: number
}

export function useRecordMatchForm() {
  const state = ref<FormState>('selecting')
  const homePlayerId = ref<string | null>(null)
  const awayPlayerId = ref<string | null>(null)
  const homeScore = ref(0)
  const awayScore = ref(0)
  const decidedOnPenalties = ref(false)
  const matchId = ref(uuidv7())
  const submitError = ref<string | null>(null)
  const resultSession = ref<ResultSessionContext | null>(null)

  const preview = useMatchPreview()
  const record = useRecordMatch()

  const bothSelected = computed(() => homePlayerId.value !== null && awayPlayerId.value !== null)
  const isValid = computed(
    () => bothSelected.value && homePlayerId.value !== awayPlayerId.value,
  )

  function selectPlayer(playerId: string): void {
    if (state.value !== 'selecting') return
    // Already-selected grid tiles are inert (design-spec.md's PlayerGrid spec) — clearing a slot
    // happens by tapping the slot itself, not by tapping the grid tile again.
    if (homePlayerId.value === playerId || awayPlayerId.value === playerId) return
    if (homePlayerId.value === null) {
      homePlayerId.value = playerId
    } else if (awayPlayerId.value === null) {
      awayPlayerId.value = playerId
    } else {
      return
    }
    if (bothSelected.value) state.value = 'scoring'
  }

  function clearSlot(side: 'home' | 'away'): void {
    if (state.value !== 'selecting' && state.value !== 'scoring') return
    if (side === 'home') homePlayerId.value = null
    else awayPlayerId.value = null
    state.value = 'selecting'
  }

  function swapSides(): void {
    const h = homePlayerId.value
    homePlayerId.value = awayPlayerId.value
    awayPlayerId.value = h
    const hs = homeScore.value
    homeScore.value = awayScore.value
    awayScore.value = hs
  }

  function incrementScore(side: 'home' | 'away'): void {
    const target = side === 'home' ? homeScore : awayScore
    target.value = Math.min(MAX_SCORE, target.value + 1)
  }
  function decrementScore(side: 'home' | 'away'): void {
    const target = side === 'home' ? homeScore : awayScore
    target.value = Math.max(0, target.value - 1)
  }
  function setScore(side: 'home' | 'away', value: number): void {
    const clamped = Math.max(0, Math.min(MAX_SCORE, Math.round(value) || 0))
    if (side === 'home') homeScore.value = clamped
    else awayScore.value = clamped
  }

  // Preview: debounced 150ms, cancelled the moment submission starts (docs/ARCHITECTURE.md).
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  watch([homePlayerId, awayPlayerId, homeScore, awayScore], () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (state.value !== 'scoring' || !bothSelected.value) return
    debounceTimer = setTimeout(() => {
      preview.mutate({
        homePlayerId: homePlayerId.value!,
        awayPlayerId: awayPlayerId.value!,
        homeScore: homeScore.value,
        awayScore: awayScore.value,
      })
    }, PREVIEW_DEBOUNCE_MS)
  })

  async function submit(): Promise<void> {
    if (!isValid.value) return
    if (debounceTimer) clearTimeout(debounceTimer)
    submitError.value = null
    state.value = 'submitting'
    try {
      const session = await queryClient.ensureQueryData(currentSessionQueryOptions)
      const data = await record.mutateAsync({
        id: matchId.value,
        homePlayerId: homePlayerId.value!,
        awayPlayerId: awayPlayerId.value!,
        homeScore: homeScore.value,
        awayScore: awayScore.value,
        decidedOnPenalties: decidedOnPenalties.value,
        ...(session ? { sessionId: session.id } : {}),
      })
      if (session) {
        const { data: summary } = await apiClient.GET('/sessions/{id}', {
          params: { path: { id: session.id } },
        })
        resultSession.value = summary ? { name: session.name, matchCount: summary.matchCount } : null
      } else {
        resultSession.value = null
      }
      void data
      state.value = 'result'
    } catch (error) {
      // Network failure or 5xx: return to scoring with all state intact and an inline retry — the
      // entered match is never lost. Retrying reuses the same matchId, so a duplicate that
      // actually reached the server comes back as the original 200, not an error.
      submitError.value = error instanceof Error ? error.message : 'Failed to record match'
      state.value = 'scoring'
    }
  }

  function recordAnother(): void {
    const h = homePlayerId.value
    homePlayerId.value = awayPlayerId.value
    awayPlayerId.value = h
    homeScore.value = 0
    awayScore.value = 0
    decidedOnPenalties.value = false
    matchId.value = uuidv7()
    submitError.value = null
    state.value = 'scoring'
  }

  function done(): void {
    state.value = 'done'
  }

  return {
    state,
    homePlayerId,
    awayPlayerId,
    homeScore,
    awayScore,
    decidedOnPenalties,
    isValid,
    submitError,
    resultSession,
    preview,
    record,
    selectPlayer,
    clearSlot,
    swapSides,
    incrementScore,
    decrementScore,
    setScore,
    submit,
    recordAnother,
    done,
  }
}
