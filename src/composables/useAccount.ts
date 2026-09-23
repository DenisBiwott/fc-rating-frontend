// What the shell's account controls need — sign-in state, log out, and the theme toggle — shared
// by AccountBar (mobile/tablet) and DesktopRail (desktop) so the two can't drift apart.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useCurrentUser, useLogout } from '@/queries/useCurrentUser'

export function useAccount() {
  const { data: user, isPending } = useCurrentUser()
  const logout = useLogout()
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()

  const isAdmin = computed(() => user.value?.role === 'admin')
  const nextTheme = computed(() => (theme.value === 'dark' ? 'light' : 'dark'))

  async function logOut(): Promise<void> {
    await logout.mutateAsync()
    await router.push({ name: 'leaderboard' })
  }

  return { user, isPending, isAdmin, nextTheme, toggleTheme, logOut }
}
