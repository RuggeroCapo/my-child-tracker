import { create } from 'zustand'

export type Tone = 'success' | 'info' | 'warning' | 'error'
export type ThemePref = 'system' | 'light' | 'dark'

export interface Toast {
  id: number
  tone: Tone
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  duration: number
  /** In uscita: resta a schermo il tempo dell'animazione. */
  leaving?: boolean
}

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error'

interface UiState {
  toasts: Toast[]
  theme: ThemePref
  syncStatus: SyncStatus
  toast: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => number
  dismiss: (id: number) => void
  setTheme: (t: ThemePref) => void
  setSyncStatus: (s: SyncStatus) => void
}

let nextToastId = 1
const TOAST_EXIT_MS = 160
const THEME_KEY = 'bebe-theme'

function readTheme(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(pref: ThemePref) {
  const dark =
    pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', dark ? '#1a1016' : '#fbf4f0'))
}

export const useUi = create<UiState>()((set, get) => ({
  toasts: [],
  theme: readTheme(),
  syncStatus: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
  toast: (t) => {
    const id = nextToastId++
    const toast: Toast = { duration: t.action ? 6000 : 3500, ...t, id }
    set((s) => ({ toasts: [...s.toasts.slice(-2), toast] }))
    setTimeout(() => get().dismiss(id), toast.duration)
    return id
  },
  dismiss: (id) => {
    const t = get().toasts.find((x) => x.id === id)
    if (!t || t.leaving) return
    set((s) => ({ toasts: s.toasts.map((x) => (x.id === id ? { ...x, leaving: true } : x)) }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), TOAST_EXIT_MS)
  },
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // ignore
    }
    applyTheme(theme)
    set({ theme })
  },
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}))

export const toast = (t: Parameters<UiState['toast']>[0]) => useUi.getState().toast(t)
