// Client for the AI proxy (/api/ai). The browser never sees the API key.
// Every call has a local fallback so the demo never breaks.

import { compactForLLM } from '../lib/analytics.js'
import { MED_KB } from '../data/meds.js'
import { overviewPrompt, tabPrompt, chatPrompt, doctorPrompt } from './prompts.js'
import { localOverview, localTabInsight, localChat, localDoctorQuestions } from './localEngine.js'
import { classifyInput, FIXED, postFilter } from './guardrails.js'
import { LANGS } from '../i18n.js'

let health = null
export async function aiHealth() {
  if (health) return health
  try {
    const r = await fetch('/api/ai/health')
    health = r.ok ? await r.json() : { configured: false }
  } catch { health = { configured: false } }
  return health
}

const langName = id => LANGS.find(l => l.id === id)?.ai || 'English'

async function call(messages, { json = false, temperature = .4 } = {}) {
  const h = await aiHealth()
  if (!h.configured) throw new Error('not-configured')
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, json, temperature }),
  })
  if (!r.ok) throw new Error('ai-failed ' + r.status)
  const data = await r.json()
  return { text: data.text, model: data.model }
}

function parseJSON(text) {
  const m = text.match(/\{[\s\S]*\}/)
  return JSON.parse(m ? m[0] : text)
}

const dataMsg = (ctx, extra = {}) => ({
  role: 'user',
  content: `USER_DATA:\n${JSON.stringify(compactForLLM(ctx))}\n${Object.entries(extra).map(([k, v]) => `${k}:\n${JSON.stringify(v)}`).join('\n')}`,
})

function cached(key, fn) {
  try {
    const hit = sessionStorage.getItem(key)
    if (hit) return Promise.resolve(JSON.parse(hit))
  } catch { /* ignore */ }
  return fn().then(v => { try { sessionStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ } return v })
}

const sig = ctx => `${ctx.series.at(-1).key}-${ctx.week.flaresNow}-${ctx.today?.water}-${ctx.foods.length}-${ctx.profile.status}-${ctx.profile.meds.join('|')}`

export function getOverview(ctx, settings) {
  return cached(`ov-${settings.lang}-${settings.simple}-${sig(ctx)}`, async () => {
    try {
      const { text, model } = await call([{ role: 'system', content: overviewPrompt(langName(settings.lang), settings.simple) }, dataMsg(ctx)], { json: true })
      const j = parseJSON(text)
      if (!j.headline || !Array.isArray(j.points)) throw new Error('shape')
      return { ...j, plan: (j.plan || []).slice(0, 4), source: model }
    } catch {
      return localOverview(ctx)
    }
  })
}

export function getTabInsight(tab, ctx, settings) {
  return cached(`tab-${tab}-${settings.lang}-${sig(ctx)}`, async () => {
    try {
      const { text, model } = await call([{ role: 'system', content: tabPrompt(tab, langName(settings.lang), settings.simple) }, dataMsg(ctx)], { json: true })
      const j = parseJSON(text)
      if (!Array.isArray(j.insights)) throw new Error('shape')
      return { ...j, source: model }
    } catch {
      return { ...localTabInsight(tab, ctx), source: 'local' }
    }
  })
}

export async function getDoctorQuestions(ctx, concerns, settings) {
  try {
    const { text, model } = await call([{ role: 'system', content: doctorPrompt(langName(settings.lang)) }, dataMsg(ctx, { CONCERNS: concerns })], { json: true })
    const j = parseJSON(text)
    return { questions: j.questions.slice(0, 6), source: model }
  } catch {
    return { questions: localDoctorQuestions(ctx, concerns), source: 'local' }
  }
}

// Chat with guardrails on both sides.
export async function chatReply(history, ctx, settings) {
  const last = history[history.length - 1].content
  const route = classifyInput(last)
  if (route.type === 'crisis') return { text: FIXED.crisis, source: 'guardrail', route: route.type }
  if (route.type === 'emergency') return { text: FIXED.emergency, source: 'guardrail', route: route.type }
  if (route.type === 'dose_change') return { text: FIXED.dose_change(route.med), source: 'guardrail', route: route.type }
  if (route.type === 'unknown_med') return { text: FIXED.unknown_med, source: 'guardrail', route: route.type }

  const facts = route.med ? [route.med] : MED_KB.filter(m => ctx.profile.meds.some(l => l.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])))
  try {
    const { text, model } = await call([
      { role: 'system', content: chatPrompt(langName(settings.lang), settings.simple) },
      dataMsg(ctx, { MEDICINE_FACTS: facts }),
      { role: 'assistant', content: 'Understood. I will only use USER_DATA and MEDICINE_FACTS.' },
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    ], { temperature: .5 })
    const f = postFilter(text)
    return { text: f.text, source: model, route: route.type, filtered: f.flagged }
  } catch {
    return { text: localChat(last, ctx), source: 'local', route: route.type }
  }
}
