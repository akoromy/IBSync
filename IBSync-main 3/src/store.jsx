import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { DEMO_PROFILE, generateSeed, demoSchedule } from './data/seed.js'
import { buildContext } from './lib/analytics.js'
import { setCustomFoods } from './data/foods.js'
import { medById } from './data/meds.js'
import { translator } from './i18n.js'
import { addMonths, format, parseISO } from 'date-fns'

const KEY = 'ibsync.v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.events && s.profile) return migrate(s)
    }
  } catch { /* storage unavailable */ }
  return fresh()
}

// Bring older saved states up to the current shape without losing logs.
function migrate(s) {
  const p = { ...s.profile }
  p.status ||= 'diagnosed'
  p.customFoods ||= []
  p.meds = (p.meds || []).map(m => ({ kbId: medById[m.id] ? m.id : null, ...m }))
  if (!s.schedule) {
    s.schedule = p.appointments
      ? p.appointments.map(a => ({ id: a.id, kind: 'appointment', title: a.title, date: format(new Date(Date.now() + (a.inDays || 0) * 864e5), 'yyyy-MM-dd'), time: '', where: a.where || '', repeat: 'none' }))
      : demoSchedule()
  }
  delete p.appointments
  return { onboarded: true, ...s, profile: p }
}

function fresh() {
  return {
    profile: { ...DEMO_PROFILE, meds: DEMO_PROFILE.meds.map(m => ({ kbId: m.id, ...m })), foodOverrides: {}, selfFlags: [] },
    events: generateSeed(new Date()),
    schedule: demoSchedule(),
    settings: { theme: 'oat', lang: 'en', size: 'md', motion: 'auto', simple: false },
    planDone: {},
    concerns: ['Bloating most evenings, even on "safe" days'],
    chat: [],
    onboarded: false,
    seededAt: new Date().toISOString(),
  }
}

let n = 0
export const uid = (p = 'u') => `${p}${Date.now().toString(36)}${(n++).toString(36)}`

const nextDate = (date, repeat) => {
  const months = { '3m': 3, '6m': 6, '12m': 12 }[repeat]
  return months ? format(addMonths(parseISO(date), months), 'yyyy-MM-dd') : null
}

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
    case 'onboard': {
      const suspected = action.status === 'suspected'
      return {
        ...state, onboarded: true,
        profile: {
          ...state.profile, status: action.status, name: action.name || state.profile.name,
          subtype: suspected ? 'Not yet diagnosed' : state.profile.subtype,
          meds: suspected ? [] : state.profile.meds,
        },
        schedule: suspected
          ? [{ id: 's1', kind: 'appointment', title: 'GP visit — talk about gut symptoms', date: format(new Date(Date.now() + 14 * 864e5), 'yyyy-MM-dd'), time: '', where: 'Polyclinic or family GP', repeat: 'none' }]
          : state.schedule,
        concerns: suspected ? ['Tummy pain and bloating most weeks for a few months', 'Stools keep switching between loose and normal'] : state.concerns,
      }
    }
    case 'foodOverride': {
      const o = { ...state.profile.foodOverrides }
      if (action.verdict) o[action.id] = action.verdict
      else delete o[action.id]
      return { ...state, profile: { ...state.profile, foodOverrides: o } }
    }
    case 'addFood':
      return { ...state, profile: { ...state.profile, customFoods: [...state.profile.customFoods, action.food] } }
    case 'removeFood':
      return { ...state, profile: { ...state.profile, customFoods: state.profile.customFoods.filter(f => f.id !== action.id) } }
    case 'saveMed': {
      const exists = state.profile.meds.some(m => m.id === action.med.id)
      const meds = exists ? state.profile.meds.map(m => m.id === action.med.id ? action.med : m) : [...state.profile.meds, action.med]
      return { ...state, profile: { ...state.profile, meds } }
    }
    case 'removeMed':
      return { ...state, profile: { ...state.profile, meds: state.profile.meds.filter(m => m.id !== action.id) } }
    case 'saveItem': {
      const exists = state.schedule.some(x => x.id === action.item.id)
      const schedule = exists ? state.schedule.map(x => x.id === action.item.id ? action.item : x) : [...state.schedule, action.item]
      return { ...state, schedule }
    }
    case 'removeItem':
      return { ...state, schedule: state.schedule.filter(x => x.id !== action.id) }
    case 'doneItem': {
      // repeating items roll forward; one-offs are removed
      const schedule = state.schedule.flatMap(x => {
        if (x.id !== action.id) return [x]
        const nd = nextDate(x.date, x.repeat)
        return nd ? [{ ...x, date: nd }] : []
      })
      return { ...state, schedule }
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

  const ctx = useMemo(() => {
    setCustomFoods(state.profile.customFoods)
    return buildContext(state.events, state.profile, new Date())
  }, [state.events, state.profile])
  const t = useMemo(() => translator(state.settings.lang), [state.settings.lang])

  const value = useMemo(() => ({ state, dispatch, ctx, t }), [state, ctx, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(Ctx)
