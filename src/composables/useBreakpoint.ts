// JS-side breakpoint, for behaviour that depends on width — not just layout, which CSS handles
// (docs/ARCHITECTURE.md#responsive-shell). Matches Tailwind's `lg` (1024px). One shared
// MediaQueryList for the whole app, created on first use.
import { readonly, ref, type Ref } from 'vue'

let isDesktop: Ref<boolean> | null = null

export function useIsDesktop(): Readonly<Ref<boolean>> {
  if (isDesktop === null) {
    const query = window.matchMedia('(min-width: 1024px)')
    const state = ref(query.matches)
    query.addEventListener('change', (event) => {
      state.value = event.matches
    })
    isDesktop = state
  }
  return readonly(isDesktop)
}
