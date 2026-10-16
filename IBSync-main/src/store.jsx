import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { DEMO_PROFILE, generateSeed } from './data/seed.js'
import { buildContext } from './lib/analytics.js'
import { translator } from './i18n.js'

const KEY = 'ibsync.v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.events && s.profile) return s
    }
  } catch { /* storage unavailable */ }
  return fresh()
}

function fresh() {
  return {
    profile: { ...DEMO_PROFILE, foodOverrides: {}, selfFlags: [] },
    events: generateSeed(new Date()),
    settings: { theme: 'oat', lang: 'en', size: 'md', motion: 'auto', simple: false },
    planDone: {},
    concerns: ['Bloating most evenings, even on "safe" days'],
    chat: [],
    seededAt: new Date().toISOString(),
  }
}

let n = 0
const uid = () => `u${Date.now().toString(36)}${(n++).toString(36)}`

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, events: [...state.events, { id: uid(), ts: new Date().toISOString(), ...action.event }].sort((a, b) => a.ts.localeCompare(b.ts)) }
    case 'remove':
      return { ...state, events: state.events.filter(e => e.id !== action.id) }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'profile':
      return { ...state, profile: { ...state.profile, ...action.patch } }
    case 'foodOverride': {
      const o = { ...state.profile.foodOverrides }
      if (action.verdict) o[action.id] = action.verdict
      else delete o[action.id]
      return { ...state, profile: { ...state.profile, foodOverrides: o } }
    }
    case 'plan':
      return { ...state, planDone: { ...state.planDone, [action.id]: !state.planDone[action.id] } }
    case 'concerns':
      return { ...state, concerns: action.list }
    case 'chat':
      return { ...state, chat: action.list }
    case 'reset':
      return { ...fresh(), settings: state.settings }
    default:
      return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  useEffect(() => {
    const h = document.documentElement
    h.dataset.theme = state.settings.theme
    h.dataset.size = state.settings.size
    h.dataset.motion = state.settings.motion
    h.lang = state.settings.lang
  }, [state.settings])

  const ctx = useMemo(() => buildContext(state.events, state.profile, new Date()), [state.events, state.profile])
  const t = useMemo(() => translator(state.settings.lang), [state.settings.lang])

  const value = useMemo(() => ({ state, dispatch, ctx, t }), [state, ctx, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(Ctx)
