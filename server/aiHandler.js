// Server-side AI proxy. Holds the API key; the browser never sees it.
// Works with any OpenAI-compatible endpoint. Defaults target Tencent Hunyuan.
//
//   AI_API_KEY   your Tencent Cloud Hunyuan (or LKEAP / DeepSeek) API key
//   AI_BASE_URL  default https://api.hunyuan.cloud.tencent.com/v1
//   AI_MODEL     default hunyuan-turbos-latest
//
// Trust boundary: only the de-identified summary built by compactForLLM()
// (numbers, food names, one diary line) is sent upstream. No names, no raw logs.

const cfg = () => ({
  key: process.env.AI_API_KEY || process.env.HUNYUAN_API_KEY || '',
  base: (process.env.AI_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1').replace(/\/$/, ''),
  model: process.env.AI_MODEL || 'hunyuan-turbos-latest',
})

export function health() {
  const c = cfg()
  return { configured: !!c.key, model: c.key ? c.model : null }
}

export async function complete({ messages, json = false, temperature = 0.4 }) {
  const c = cfg()
  if (!c.key) { const e = new Error('AI not configured'); e.status = 503; throw e }
  if (!Array.isArray(messages) || messages.length > 24) { const e = new Error('bad request'); e.status = 400; throw e }
  const body = {
    model: c.model,
    messages: messages.map(m => ({ role: m.role, content: String(m.content).slice(0, 12000) })),
    temperature: Math.max(0, Math.min(1, +temperature || 0.4)),
    max_tokens: 700,
  }
  if (json) body.response_format = { type: 'json_object' }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25000)
  try {
    let r = await fetch(`${c.base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!r.ok && json) {
      // some models reject response_format — retry without it
      delete body.response_format
      r = await fetch(`${c.base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${c.key}` },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
    }
    if (!r.ok) { const e = new Error(`upstream ${r.status}`); e.status = 502; throw e }
    const data = await r.json()
    return { text: data.choices?.[0]?.message?.content || '', model: data.model || c.model }
  } finally {
    clearTimeout(timer)
  }
}

// Abuse protection for a public deployment: per-visitor rate limit plus a
// daily cap on total model calls, so nobody can burn through the API quota.
//   AI_RATE_PER_10MIN  per-IP calls per 10 minutes (default 30)
//   AI_DAILY_LIMIT     total calls per day across everyone (default 300)
const hits = new Map()
let day = new Date().toDateString(), dayCount = 0
export function allow(ip) {
  const now = Date.now()
  const perIp = +(process.env.AI_RATE_PER_10MIN || 30)
  const daily = +(process.env.AI_DAILY_LIMIT || 300)
  if (new Date().toDateString() !== day) { day = new Date().toDateString(); dayCount = 0 }
  if (dayCount >= daily) return false
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000)
  if (recent.length >= perIp) return false
  recent.push(now); hits.set(ip, recent); dayCount++
  if (hits.size > 5000) hits.clear()
  return true
}

// Connect/Express-style middleware used by Vite dev/preview and server/index.js
export function aiMiddleware() {
  return async (req, res, next) => {
    if (!req.url.startsWith('/api/ai')) return next()
    res.setHeader('Content-Type', 'application/json')
    if (req.url.startsWith('/api/ai/health')) return res.end(JSON.stringify(health()))
    if (req.method !== 'POST') { res.statusCode = 405; return res.end('{}') }
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
    if (!allow(ip)) { res.statusCode = 429; return res.end(JSON.stringify({ error: 'Too many AI requests, try again later' })) }
    let raw = ''
    for await (const chunk of req) { raw += chunk; if (raw.length > 200000) break }
    try {
      const out = await complete(JSON.parse(raw || '{}'))
      res.end(JSON.stringify(out))
    } catch (e) {
      res.statusCode = e.status || 500
      res.end(JSON.stringify({ error: e.message }))
    }
  }
}
