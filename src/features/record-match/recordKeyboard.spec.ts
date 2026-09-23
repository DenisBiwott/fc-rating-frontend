import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { handleRecordKeydown, type RecordKeyboardTarget } from './recordKeyboard'
import type { FormState, Side } from './useRecordMatchForm'

function setup(state: FormState, names = ['Ras', 'Dennis', 'Dave', 'Rico']) {
  const root = document.createElement('section')
  root.tabIndex = -1
  for (const name of names) {
    const tile = document.createElement('button')
    tile.setAttribute('aria-label', `Select ${name}`)
    root.appendChild(tile)
  }
  const input = document.createElement('input')
  root.appendChild(input)
  document.body.appendChild(root)

  const form: RecordKeyboardTarget = {
    state: ref(state),
    activeSide: ref<Side>('home'),
    isValid: ref(state === 'scoring'),
    setActiveSide: vi.fn((side: Side) => {
      form.activeSide.value = side
    }),
    incrementScore: vi.fn(),
    decrementScore: vi.fn(),
    submit: vi.fn(async () => {}),
    reset: vi.fn(),
  }
  const press = (key: string, target: HTMLElement = root, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
    Object.defineProperty(event, 'target', { value: target })
    handleRecordKeydown(event, { form, root, escapeClears: true })
    return event
  }
  const focusedName = () => document.activeElement?.getAttribute('aria-label')
  return { root, form, press, input, focusedName }
}

describe('handleRecordKeydown', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('typing an initial focuses the next matching player, cycling through repeats', () => {
    const { press, focusedName } = setup('selecting')
    press('r')
    expect(focusedName()).toBe('Select Ras')
    press('R')
    expect(focusedName()).toBe('Select Rico')
    press('r')
    expect(focusedName()).toBe('Select Ras')
    press('d')
    expect(focusedName()).toBe('Select Dennis')
  })

  it('↑/↓ walk the players while selecting, and change the active score while scoring', () => {
    const selecting = setup('selecting')
    selecting.press('ArrowDown')
    expect(selecting.focusedName()).toBe('Select Ras')
    selecting.press('ArrowDown')
    expect(selecting.focusedName()).toBe('Select Dennis')
    selecting.press('ArrowUp')
    expect(selecting.focusedName()).toBe('Select Ras')
    document.body.innerHTML = ''

    const scoring = setup('scoring')
    scoring.press('ArrowRight')
    expect(scoring.form.activeSide.value).toBe('away')
    scoring.press('ArrowUp')
    expect(scoring.form.incrementScore).toHaveBeenCalledWith('away')
    scoring.press('ArrowLeft')
    scoring.press('ArrowDown')
    expect(scoring.form.decrementScore).toHaveBeenCalledWith('home')
  })

  it('↵ confirms while scoring, but leaves a focused button to do its own thing', () => {
    const { root, press, form } = setup('scoring')
    press('Enter', root.querySelector('button')!)
    expect(form.submit).not.toHaveBeenCalled()
    const event = press('Enter')
    expect(form.submit).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('Esc clears; typing in a field and modifier combos are left alone', () => {
    const { press, form, input, focusedName } = setup('selecting')
    press('Escape')
    expect(form.reset).toHaveBeenCalledOnce()

    press('r', input)
    press('r', undefined, { metaKey: true })
    expect(focusedName()).not.toBe('Select Ras')
  })

  it('ignores keys outside selecting/scoring (the result overlay handles its own)', () => {
    const { press, form } = setup('result')
    press('ArrowUp')
    press('Escape')
    expect(form.incrementScore).not.toHaveBeenCalled()
    expect(form.reset).not.toHaveBeenCalled()
  })
})
