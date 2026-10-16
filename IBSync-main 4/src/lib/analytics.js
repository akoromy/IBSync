// Analytics engine: turns raw logs into daily aggregates, trigger-food
// scores, correlations, Rome IV stool pattern, adherence and red flags.
// Everything here is deterministic and explainable — the LLM only rephrases
// these numbers, it never invents them.

import { foodById, TRIGGER_TAGS } from '../data/foods.js'
import { format, startOfDay, subDays, isSameDay, differenceInMinutes, parseISO } from 'date-fns'

export const dayKey = d => format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd')

export function statusOf(maxPain) {
  if (maxPain == null) return 'none'
  if (maxPain >= 6) return 'flare'
  if (maxPain >= 3) return 'mild'
  return 'calm'
}

export function dailySeries(events, days = 28, now = new Date()) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(subDays(now, i))
    const k = dayKey(day)
    const ev = events.filter(e => dayKey(e.ts) === k)
    const sym = ev.filter(e => e.kind === 'symptom')
    const stools = ev.filter(e => e.kind === 'stool')
    const water = ev.filter(e => e.kind === 'water').reduce((s, e) => s + e.ml, 0)
    const exercise = ev.filter(e => e.kind === 'exercise').reduce((s, e) => s + e.minutes, 0)
    const stress = ev.filter(e => e.kind === 'stress').map(e => e.level)
    const sleep = ev.filter(e => e.kind === 'sleep').map(e => e.hours)
    const mood = ev.filter(e => e.kind === 'diary').map(e => e.mood)
    const meds = ev.filter(e => e.kind === 'med' && !e.prn)
    const maxPain = sym.length ? Math.max(...sym.map(s => s.pain)) : (ev.length ? 0 : null)
    out.push({
      key: k,
      date: day,
      label: format(day, 'd MMM'),
      short: format(day, 'EEEEE'),
      maxPain,
      avgPain: sym.length ? +(sym.reduce((s, e) => s + e.pain, 0) / sym.length).toFixed(1) : (ev.length ? 0 : null),
      symptoms: sym.length,
      stools: stools.length,
      bristol: stools.length ? +(stools.reduce((s, e) => s + e.bristol, 0) / stools.length).toFixed(1) : null,
      water,
      exercise,
      stress: stress.length ? stress[stress.length - 1] : null,
      sleep: sleep.length ? sleep[0] : null,
      mood: mood.length ? mood[mood.length - 1] : null,
      dosesTaken: meds.filter(m => m.status === 'taken').length,
      dosesDue: meds.length,
      status: statusOf(maxPain),
      logged: ev.length > 0,
    })
  }
  return out
}

// For each meal, the worst symptom 1–6 hours afterwards.
function postMealPain(events) {
  const sym = events.filter(e => e.kind === 'symptom')
  return events.filter(e => e.kind === 'meal').map(m => {
    const mt = parseISO(m.ts)
    const after = sym.filter(s => {
      const dm = differenceInMinutes(parseISO(s.ts), mt)
      return dm >= 45 && dm <= 360
    })
    return { meal: m, pain: after.length ? Math.max(...after.map(a => a.pain)) : 0, linked: after }
  })
}

export function foodScores(events, overrides = {}) {
  const pm = postMealPain(events)
  if (!pm.length) return { foods: [], tags: [], baseline: 0 }
  const baseline = pm.reduce((s, x) => s + x.pain, 0) / pm.length
  const byFood = {}
  const byTag = {}
  for (const x of pm) {
    const tagsSeen = new Set()
    for (const f of x.meal.foods) {
      ;(byFood[f] ||= []).push(x.pain)
      for (const t of foodById[f]?.tags || []) tagsSeen.add(t)
    }
    for (const t of tagsSeen) (byTag[t] ||= []).push(x.pain)
  }
  const classify = (n, diff) => {
    if (n < 3) return 'learning'
    if (diff >= 1.6) return 'avoid'
    if (diff >= .7) return 'caution'
    if (diff <= -.4) return 'safe'
    return 'neutral'
  }
  const foods = Object.entries(byFood).map(([fid, arr]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const diff = mean - baseline
    const reactions = arr.filter(p => p >= 3).length
    const auto = classify(arr.length, diff)
    return {
      id: fid, food: foodById[fid], n: arr.length, mean: +mean.toFixed(1), diff: +diff.toFixed(1),
      reactions, rate: Math.round((reactions / arr.length) * 100),
      verdict: overrides[fid] || auto, auto, overridden: !!overrides[fid],
    }
  }).sort((a, b) => b.diff - a.diff)
  const tags = Object.entries(byTag).map(([t, arr]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    return { tag: t, label: TRIGGER_TAGS[t], n: arr.length, mean: +mean.toFixed(1), diff: +(mean - baseline).toFixed(1), rate: Math.round(arr.filter(p => p >= 3).length / arr.length * 100) }
  }).sort((a, b) => b.diff * Math.min(1, b.n / 10) - a.diff * Math.min(1, a.n / 10))
  return { foods, tags, baseline: +baseline.toFixed(1) }
}

export function mealSymptomLinks(events, day) {
  return postMealPain(events.filter(e => !day || isSameDay(parseISO(e.ts), day)))
    .filter(x => x.linked.length)
}

function pearson(xs, ys) {
  const n = xs.length
  if (n < 5) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    dx += (xs[i] - mx) ** 2
    dy += (ys[i] - my) ** 2
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0
}

// Compare flare-day rate when a factor is "high" vs "low", plus Pearson r vs max pain.
export function lifestyleEffects(series) {
  const days = series.filter(d => d.logged && d.maxPain != null)
  const split = (name, getter, isHigh, highLabel, lowLabel) => {
    const valid = days.filter(d => getter(d) != null)
    const hi = valid.filter(d => isHigh(getter(d)))
    const lo = valid.filter(d => !isHigh(getter(d)))
    const rate = arr => arr.length ? Math.round(arr.filter(d => d.maxPain >= 6).length / arr.length * 100) : null
    const avg = arr => arr.length ? +(arr.reduce((s, d) => s + d.maxPain, 0) / arr.length).toFixed(1) : null
    return {
      factor: name, highLabel, lowLabel,
      nHigh: hi.length, nLow: lo.length,
      flareHigh: rate(hi), flareLow: rate(lo),
      painHigh: avg(hi), painLow: avg(lo),
      r: +pearson(valid.map(getter), valid.map(d => d.maxPain)).toFixed(2),
    }
  }
  return [
    split('stress', d => d.stress, v => v >= 4, 'high-stress days (4–5)', 'calmer days (1–3)'),
    split('sleep', d => d.sleep, v => v < 6.5, 'short-sleep nights (<6.5h)', 'nights of 6.5h+'),
    split('exercise', d => d.exercise, v => v >= 20, 'days you moved 20+ min', 'days you didn\'t'),
    split('water', d => d.water, v => v >= 1750, 'days with 1.75L+ water', 'days with less'),
  ]
}

// Rome IV stool-pattern subtype (based on % of abnormal-stool days)
export function stoolPattern(events, now = new Date(), days = 28) {
  const since = subDays(now, days)
  const stools = events.filter(e => e.kind === 'stool' && parseISO(e.ts) >= since)
  const dist = [1, 2, 3, 4, 5, 6, 7].map(b => ({ type: b, count: stools.filter(s => s.bristol === b).length }))
  const total = stools.length || 1
  const hard = stools.filter(s => s.bristol <= 2).length / total
  const loose = stools.filter(s => s.bristol >= 6).length / total
  let subtype = 'IBS-U'
  if (hard > .25 && loose > .25) subtype = 'IBS-M'
  else if (hard > .25) subtype = 'IBS-C'
  else if (loose > .25) subtype = 'IBS-D'
  const perDay = +(stools.length / days).toFixed(1)
  return {
    dist, total: stools.length, hardPct: Math.round(hard * 100), loosePct: Math.round(loose * 100),
    normalPct: Math.round(stools.filter(s => s.bristol >= 3 && s.bristol <= 5).length / total * 100),
    subtype, perDay, urgent: stools.filter(s => s.urgency).length,
    blood: stools.filter(s => s.blood).length,
  }
}

export function adherence(events, profile, now = new Date(), days = 14) {
  const since = subDays(now, days)
  const doses = events.filter(e => e.kind === 'med' && !e.prn && parseISO(e.ts) >= since)
  return profile.meds.filter(m => !m.prn).map(m => {
    const mine = doses.filter(d => d.medId === m.id)
    const taken = mine.filter(d => d.status === 'taken').length
    const missed = mine.filter(d => d.status === 'missed')
    const reasons = {}
    for (const x of missed) reasons[x.reason || 'No reason given'] = (reasons[x.reason || 'No reason given'] || 0) + 1
    const bySlot = m.times.map(t => {
      const h = +t.split(':')[0]
      const slot = mine.filter(d => parseISO(d.scheduled || d.ts).getHours() === h)
      return { time: t, pct: slot.length ? Math.round(slot.filter(d => d.status === 'taken').length / slot.length * 100) : null }
    })
    return {
      med: m, taken, due: mine.length,
      pct: mine.length ? Math.round(taken / mine.length * 100) : null,
      reasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]),
      bySlot,
      daysLeft: m.times.length ? Math.floor(m.supply / m.times.length) : null,
    }
  })
}

// Rome IV / NICE "alarm features" — anything here goes to a professional, not to self-care.
export const RED_FLAG_RULES = [
  { id: 'blood', label: 'Blood in your stool or black, tarry stools', urgent: true },
  { id: 'weight', label: 'Losing weight without trying', urgent: false },
  { id: 'night', label: 'Symptoms waking you up at night', urgent: false },
  { id: 'fever', label: 'Fever with tummy pain or diarrhoea', urgent: true },
  { id: 'vomit', label: 'Repeated vomiting', urgent: true },
  { id: 'severe', label: 'Severe pain that is new or different from your usual', urgent: true },
  { id: 'age', label: 'New symptoms starting after age 50', urgent: false },
  { id: 'family', label: 'Family history of bowel cancer, coeliac or IBD', urgent: false },
  { id: 'anaemia', label: 'Feeling unusually tired, pale or breathless (possible anaemia)', urgent: false },
]

export function detectRedFlags(events, profile, now = new Date()) {
  const since = subDays(now, 14)
  const recent = events.filter(e => parseISO(e.ts) >= since)
  const flags = []
  if (recent.some(e => e.kind === 'stool' && e.blood)) flags.push('blood')
  if (recent.some(e => e.kind === 'symptom' && e.pain >= 9)) flags.push('severe')
  const night = recent.filter(e => e.kind === 'symptom' && (() => { const h = parseISO(e.ts).getHours(); return h >= 1 && h <= 5 })())
  if (night.length >= 2) flags.push('night')
  if (recent.some(e => e.kind === 'symptom' && (e.types || []).includes('fever'))) flags.push('fever')
  if (recent.some(e => e.kind === 'symptom' && (e.types || []).includes('vomiting'))) flags.push('vomit')
  for (const f of profile.selfFlags || []) if (!flags.includes(f)) flags.push(f)
  return RED_FLAG_RULES.filter(r => flags.includes(r.id))
}

export function weekCompare(series) {
  const last = series.slice(-7)
  const prev = series.slice(-14, -7)
  const flares = arr => arr.filter(d => d.maxPain >= 6).length
  const avg = (arr, k) => {
    const v = arr.filter(d => d[k] != null)
    return v.length ? +(v.reduce((s, d) => s + d[k], 0) / v.length).toFixed(1) : null
  }
  return {
    flaresNow: flares(last), flaresPrev: flares(prev),
    painNow: avg(last, 'maxPain'), painPrev: avg(prev, 'maxPain'),
    calmNow: last.filter(d => d.status === 'calm').length,
    stressNow: avg(last, 'stress'), sleepNow: avg(last, 'sleep'),
    waterNow: Math.round(avg(last, 'water') || 0), exerciseNow: Math.round(avg(last, 'exercise') || 0),
  }
}

export function moodFromDiary(events, now = new Date(), days = 14) {
  const since = subDays(now, days)
  const d = events.filter(e => e.kind === 'diary' && parseISO(e.ts) >= since)
  const words = d.map(x => x.text.toLowerCase()).join(' ')
  const themes = []
  if (/stress|deadline|exam|anxious|work/.test(words)) themes.push('stress & workload')
  if (/sleep|slept|tired/.test(words)) themes.push('sleep')
  if (/friends|out|eating out|bubble tea/.test(words)) themes.push('eating out')
  if (/walk|mrt|exercise/.test(words)) themes.push('movement')
  if (/toilet|anxious about going out/.test(words)) themes.push('toilet anxiety')
  return {
    entries: d.length,
    avgMood: d.length ? +(d.reduce((s, x) => s + x.mood, 0) / d.length).toFixed(1) : null,
    themes,
    latest: d[d.length - 1] || null,
  }
}

// What a GP looks for when assessing possible IBS (Rome IV symptom criteria):
// recurrent abdominal pain on average ≥1 day/week, linked to ≥2 of:
//   (a) bowel movements, (b) a change in stool frequency, (c) a change in stool form.
// Rome IV also needs symptoms for 3 months (onset ≥6 months ago) — a diary can't
// confirm that, and only a doctor can diagnose IBS after ruling out other causes.
export function romeCheck(events, now = new Date(), days = 28) {
  const series = dailySeries(events, days, now)
  const logged = series.filter(d => d.logged)
  const painDays = logged.filter(d => (d.maxPain || 0) >= 3)
  const calmDays = logged.filter(d => (d.maxPain || 0) < 3)
  const weeks = Math.max(1, logged.length / 7)
  const perWeek = +(painDays.length / weeks).toFixed(1)

  const since = subDays(now, days)
  const sym = events.filter(e => e.kind === 'symptom' && e.pain >= 3 && parseISO(e.ts) >= since)
  const stools = events.filter(e => e.kind === 'stool' && parseISO(e.ts) >= since)
  const nearStool = sym.filter(s => stools.some(st => Math.abs(differenceInMinutes(parseISO(st.ts), parseISO(s.ts))) <= 120)).length
  const defecPct = sym.length ? Math.round(nearStool / sym.length * 100) : 0

  const avg = (arr, k) => { const v = arr.filter(d => d[k] != null); return v.length ? v.reduce((s, d) => s + d[k], 0) / v.length : null }
  const freqPain = avg(painDays, 'stools'), freqCalm = avg(calmDays, 'stools')
  const formPain = avg(painDays, 'bristol'), formCalm = avg(calmDays, 'bristol')

  const criteria = [
    { id: 'defecation', label: 'Pain linked to bowel movements', detail: `${defecPct}% of pain episodes happened within 2 hours of a bowel movement`, met: defecPct >= 30 },
    { id: 'frequency', label: 'Stool frequency changes with pain', detail: freqPain != null && freqCalm != null ? `${freqPain.toFixed(1)} a day on pain days vs ${freqCalm.toFixed(1)} on calmer days` : 'Not enough data yet', met: freqPain != null && freqCalm != null && Math.abs(freqPain - freqCalm) >= .5 },
    { id: 'form', label: 'Stool form changes with pain', detail: formPain != null && formCalm != null ? `Average Bristol type ${formPain.toFixed(1)} on pain days vs ${formCalm.toFixed(1)} otherwise` : 'Not enough data yet', met: formPain != null && formCalm != null && Math.abs(formPain - formCalm) >= .8 },
  ]
  const met = criteria.filter(c => c.met).length
  const enough = logged.length >= 14
  return {
    loggedDays: logged.length, target: 28, enough,
    painDays: painDays.length, perWeek, painFrequent: perWeek >= 1,
    criteria, met,
    pattern: enough && perWeek >= 1 && met >= 2 ? 'consistent' : enough ? 'partial' : 'early',
  }
}

// "Gut weather": a simple, explainable 7-day flare-risk score plus the
// factors behind it. Weights favour symptoms; everything else nudges.
export function gutWeather(series) {
  const last = series.slice(-7).filter(d => d.logged)
  const avg = (k, f = x => x) => { const v = last.map(d => d[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + f(b), 0) / v.length : null }
  const sym = (avg('maxPain') ?? 0) / 10
  const stoolDays = last.filter(d => d.bristol != null)
  const stool = stoolDays.length ? stoolDays.filter(d => d.bristol < 3 || d.bristol > 5).length / stoolDays.length : 0
  const move = 1 - Math.min(1, (avg('exercise') ?? 0) / 30)
  const sl = avg('sleep'); const sleep = sl == null ? 0.3 : Math.max(0, Math.min(1, (7.5 - sl) / 2.5))
  const st = avg('stress'); const stress = st == null ? 0.3 : (st - 1) / 4
  const score = .42 * sym + .2 * stool + .14 * stress + .12 * sleep + .12 * move
  const level = score < .28 ? 'low' : score < .45 ? 'moderate' : 'high'
  const word = g => g >= .75 ? 'Good' : g >= .5 ? 'Okay' : 'Needs care'
  const factors = [
    { id: 'symptoms', label: 'Symptoms', good: 1 - sym, detail: `Worst pain ${avg('maxPain')?.toFixed(1) ?? '–'}/10 on average` },
    { id: 'stool', label: 'Stool', good: 1 - stool, detail: `${Math.round((1 - stool) * 100)}% of days in the comfortable range` },
    { id: 'movement', label: 'Movement', good: 1 - move, detail: `${Math.round(avg('exercise') ?? 0)} min a day on average` },
    { id: 'sleep', label: 'Sleep', good: 1 - sleep, detail: `${sl?.toFixed(1) ?? '–'} h a night on average` },
  ].map(f => ({ ...f, word: word(f.good) }))
  return { score: +score.toFixed(2), level, factors }
}

export function loggingStreak(series) {
  let n = 0
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].logged) n++
    else if (i === series.length - 1) continue
    else break
  }
  return n
}

// One object with everything the AI (or local engine) needs. Kept small and
// de-identified on purpose: this is what crosses the trust boundary to the LLM.
export function buildContext(events, profile, now = new Date()) {
  const series = dailySeries(events, 28, now)
  const fs = foodScores(events, profile.foodOverrides)
  const wk = weekCompare(series)
  const life = lifestyleEffects(series)
  const stool = stoolPattern(events, now)
  const adh = adherence(events, profile, now)
  const flags = detectRedFlags(events, profile, now)
  const mood = moodFromDiary(events, now)
  const today = series[series.length - 1]
  return {
    profile: { age: profile.age, status: profile.status || 'diagnosed', subtype: profile.subtype, goals: profile.goals, meds: profile.meds.map(m => m.label) },
    rome: romeCheck(events, now),
    weather: gutWeather(series),
    streak: loggingStreak(series),
    today, week: wk, series,
    triggers: fs.foods.filter(f => ['avoid', 'caution'].includes(f.verdict)).slice(0, 5),
    safeFoods: fs.foods.filter(f => f.verdict === 'safe').sort((a, b) => b.n - a.n).slice(0, 6),
    tags: fs.tags.slice(0, 5),
    baseline: fs.baseline,
    foods: fs.foods,
    lifestyle: life, stool, adherence: adh, redFlags: flags, mood,
  }
}

export function compactForLLM(ctx) {
  // strip arrays the model doesn't need; no names, no free-text beyond the latest diary line
  return {
    profile: ctx.profile,
    last7days: ctx.series.slice(-7).map(d => ({ d: d.label, maxPain: d.maxPain, stools: d.stools, bristol: d.bristol, water: d.water, exercise: d.exercise, stress: d.stress, sleep: d.sleep, mood: d.mood })),
    week: ctx.week,
    likelyTriggers: ctx.triggers.map(t => ({ food: t.food.name, reactionRate: t.rate + '%', meals: t.n })),
    safeFoods: ctx.safeFoods.map(t => t.food.name),
    triggerComponents: ctx.tags.map(t => ({ component: t.label, reactionRate: t.rate + '%' })),
    lifestyle: ctx.lifestyle,
    stool: { subtypePattern: ctx.stool.subtype, hardPct: ctx.stool.hardPct, loosePct: ctx.stool.loosePct, perDay: ctx.stool.perDay },
    adherence: ctx.adherence.map(a => ({ med: a.med.label, pct: a.pct, missedReasons: a.reasons.slice(0, 2), weakestSlot: a.bySlot.reduce((m, s) => (s.pct != null && (m == null || s.pct < m.pct) ? s : m), null) })),
    redFlags: ctx.redFlags.map(r => r.label),
    diagnosisDiary: ctx.profile.status === 'suspected' ? { loggedDays: ctx.rome.loggedDays, painDaysPerWeek: ctx.rome.perWeek, criteriaSeen: ctx.rome.criteria.filter(c => c.met).map(c => c.label) } : undefined,
    diary: { avgMood: ctx.mood.avgMood, themes: ctx.mood.themes, latest: ctx.mood.latest?.text },
  }
}

// Plain-language one-liners for the visit pass and summary preview.
export function summaryLines(ctx) {
  const tag = ctx.tags[0]
  const life = [...ctx.lifestyle].filter(l => l.flareHigh != null && l.flareLow != null)
    .sort((a, b) => Math.abs(b.flareHigh - b.flareLow) - Math.abs(a.flareHigh - a.flareLow))[0]
  const lifePhrase = !life ? null : life.flareHigh > life.flareLow
    ? { sleep: 'short sleep', stress: 'high-stress days', exercise: 'active days', water: 'high-water days' }[life.factor]
    : { sleep: 'longer sleep', stress: 'calmer days', exercise: 'days without much movement', water: 'low-water days' }[life.factor]
  const food = tag && tag.diff > .5 ? `${tag.label.toLowerCase().replace(' (lactose)', '')} meals` : null
  const s = ctx.stool
  const top = [...s.dist].sort((a, b) => b.count - a.count)[0]
  const half = ctx.series.slice(-14), prev = ctx.series.slice(-28, -14)
  const loose = arr => { const v = arr.filter(d => d.bristol != null); return v.length ? v.filter(d => d.bristol >= 5.5).length / v.length : 0 }
  const looser = loose(half) - loose(prev)
  return {
    symptoms: `Pain on about ${ctx.rome.perWeek} days a week${food ? `, more often after ${food}` : ''}.`,
    bowel: `Mostly type ${top?.type ?? '–'}, ${s.perDay} a day${looser > .1 ? ', with looser stools in the last 2 weeks' : looser < -.1 ? ', firmer in the last 2 weeks' : ''}.`,
    patterns: [food, lifePhrase].filter(Boolean).length ? `Symptoms seem linked to ${[food, lifePhrase].filter(Boolean).join(' and ')}.` : 'No clear links yet — keep logging.',
    meds: ctx.adherence.filter(a => a.due > 0).map(a => `${a.med.label}: ${a.pct}% taken`).join(' · '),
  }
}
