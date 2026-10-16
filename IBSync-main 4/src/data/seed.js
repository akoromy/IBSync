// Deterministic 28-day demo history with realistic, discoverable patterns:
//  • dairy / garlic-onion / coconut-heavy meals → bloating & pain 2–4h later
//  • high-stress, short-sleep days → more pain, looser stools
//  • walking days → fewer flares
//  • low water + low fibre → harder stools
//  • evening Mebeverine is missed most often (eating out)
// Patterns are modelled on published IBS trigger literature (lactose & FODMAP
// sensitivity, gut–brain axis), so the analytics engine has something real to find.

import { FOODS, foodById } from './foods.js'
import { addDays, setHours, setMinutes, startOfDay, format } from 'date-fns'

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const TAG_RISK = {
  dairy: 2.6, garlic_onion: 1.7, coconut: 1.3, fatty: .8, wheat: .6, spicy: .7,
  caffeine: .5, fruit_high: 1.3, beans: 1.4, sweetener: 1.6, alcohol: 1, fizzy: .7,
}

export const DEMO_PROFILE = {
  name: 'Mei',
  age: 26,
  diagnosed: '2024',
  subtype: 'IBS-M (mixed)',
  goals: ['Fewer flare days', 'Find my trigger foods', 'Take meds on time'],
  waterGoal: 2000,
  exerciseGoal: 30,
  meds: [
    { id: 'mebeverine', label: 'Mebeverine 135 mg', times: ['07:45', '12:15', '18:45'], note: '20 min before meals', supply: 23 },
    { id: 'psyllium', label: 'Psyllium husk', times: ['21:00'], note: 'In a full glass of water', supply: 9 },
    { id: 'loperamide', label: 'Loperamide 2 mg', times: [], note: 'As needed, per label', supply: 12, prn: true },
  ],
  status: 'diagnosed',
  customFoods: [],
}

// Appointments & check-ups the user can edit. Dates are relative to first launch.
export function demoSchedule(now = new Date()) {
  const d = n => format(addDays(now, n), 'yyyy-MM-dd')
  return [
    { id: 's1', kind: 'appointment', title: 'GP review — IBS follow-up', date: d(12), time: '10:30', where: 'Polyclinic', repeat: '6m' },
    { id: 's2', kind: 'appointment', title: 'Dietitian — FODMAP reintroduction', date: d(26), time: '14:00', where: 'Hospital outpatient', repeat: 'none' },
    { id: 's3', kind: 'checkup', title: 'Medication review', date: d(40), time: '', where: 'Pharmacist or GP', repeat: '6m' },
  ]
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
let _id = 0
const id = () => `e${++_id}`

const DIARY = {
  good: [
    'Felt light today. Walked to the MRT instead of taking the bus.',
    'Quiet day, good energy. Packed fish soup for lunch.',
    'Slept well and tummy was settled most of the day.',
  ],
  mid: [
    'A bit bloated after lunch but it passed. Busy at work.',
    'Okay day. Skipped my walk because of the rain.',
    'Some cramping in the afternoon, manageable.',
  ],
  bad: [
    'Rough day. Deadline stress and I barely slept. Bloated all evening.',
    'Had bubble tea with friends and regretted it two hours later.',
    'Ran to the toilet twice on the way to class. Felt anxious about going out.',
  ],
}

export function generateSeed(now = new Date()) {
  _id = 0
  const r = mulberry32(20261016)
  const events = []
  const today = startOfDay(now)
  const at = (day, hh, mm) => setMinutes(setHours(day, hh), mm)

  for (let d = 27; d >= 0; d--) {
    const day = addDays(today, -d)
    const isWeekday = ![0, 6].includes(day.getDay())
    const examWeek = d >= 9 && d <= 14
    let stress = clamp(Math.round(1.6 + (isWeekday ? 1 : 0) + (examWeek ? 2.2 : 0) + (r() * 1.6 - .6)), 1, 5)
    const sleep = Math.round(clamp(8.3 - (stress - 1) * .7 + (r() - .5) * 1.2, 4.5, 9) * 2) / 2
    const walked = r() < (examWeek ? .25 : d < 7 ? .75 : .55)
    const exMin = walked ? 20 + Math.round(r() * 5) * 5 : 0

    const breakfast = examWeek ? pick(r, ['kopi', 'kaya_toast', 'kopi', 'teh_tarik']) : d < 7 ? pick(r, ['kopi_o', 'oats', 'toast', 'eggs', 'kopi_o', 'toast']) : pick(r, ['kopi_o', 'toast', 'congee', 'eggs', 'kaya_toast', 'kopi', 'teh_tarik', 'toast'])
    const lunch = pick(r, ['chicken_rice', 'laksa', 'fish_soup', 'yong_tau_foo', 'nasi_lemak', 'mee_goreng', 'rice_veg', 'fish_soup'])
    const dinner = pick(r, ['rice_veg', 'char_kway_teow', 'pasta_cream', 'fish_soup', 'congee', 'dal_curry', 'rice_veg'])
    const snack = r() < .5 ? pick(r, ['bubble_tea', 'apple', 'banana', 'papaya', 'crackers', 'bubble_tea', 'yogurt']) : null

    const meals = [
      { t: at(day, 8, 10 + Math.floor(r() * 30)), foods: breakfast === 'oats' ? ['oats', 'banana'] : [breakfast], slot: 'Breakfast' },
      { t: at(day, 12, 30 + Math.floor(r() * 25)), foods: [lunch], slot: 'Lunch' },
      ...(snack ? [{ t: at(day, 16, Math.floor(r() * 40)), foods: [snack], slot: 'Snack' }] : []),
      { t: at(day, 19, 10 + Math.floor(r() * 40)), foods: [dinner], slot: 'Dinner' },
    ]

    const dayBase = (stress - 2) * .75 + (sleep < 6.5 ? 1.2 : 0) - (walked ? 1.5 : 0)
    let dairyDay = false
    let worst = 0

    for (const m of meals) {
      if (m.t > now) continue
      events.push({ id: id(), kind: 'meal', ts: m.t.toISOString(), slot: m.slot, foods: m.foods })
      const tags = m.foods.flatMap(f => foodById[f]?.tags || [])
      if (tags.includes('dairy')) dairyDay = true
      const risk = tags.reduce((s, t) => s + (TAG_RISK[t] || 0), 0)
      const pain = clamp(Math.round(risk * 1.3 + dayBase + (r() * 2 - 1) - .5), 0, 8)
      if (pain >= 2) {
        const st = new Date(m.t.getTime() + (110 + r() * 110) * 60000)
        if (st <= now) {
          const types = []
          if (tags.includes('dairy') || tags.includes('fruit_high') || tags.includes('sweetener')) types.push('bloating', 'gas')
          if (tags.includes('garlic_onion') || tags.includes('beans') || tags.includes('coconut')) types.push('bloating', 'cramping')
          if (tags.includes('spicy') || tags.includes('caffeine')) types.push('urgency')
          if (!types.length) types.push('cramping')
          events.push({ id: id(), kind: 'symptom', ts: st.toISOString(), pain, types: [...new Set(types)] })
          worst = Math.max(worst, pain)
        }
      }
    }

    // stools
    const nStools = clamp(Math.round(1 + (stress >= 4 ? 1 : 0) + (dairyDay ? 1 : 0) * (r() < .6 ? 1 : 0) + (r() < .2 ? 1 : 0)), 1, 4)
    for (let i = 0; i < nStools; i++) {
      const t = at(day, 7 + i * 4 + Math.floor(r() * 3), Math.floor(r() * 59))
      if (t > now) continue
      let bristol = 4
      if (stress >= 4 || (dairyDay && i > 0)) bristol = 5 + Math.round(r() * 2)
      else if (!walked && r() < .35) bristol = 2 + Math.round(r())
      else bristol = 3 + Math.round(r() * 2)
      events.push({ id: id(), kind: 'stool', ts: t.toISOString(), bristol: clamp(bristol, 1, 7), urgency: bristol >= 6, blood: false })
    }

    // water
    const waterTarget = walked ? 1750 + Math.round(r() * 3) * 250 : 1000 + Math.round(r() * 4) * 250
    const cups = Math.round(waterTarget / 250)
    for (let i = 0; i < cups; i++) {
      const t = at(day, 8 + Math.floor((i * 13) / cups), Math.floor(r() * 59))
      if (t > now) continue
      events.push({ id: id(), kind: 'water', ts: t.toISOString(), ml: 250 })
    }

    const eveningT = at(day, 21, 30)
    if (eveningT <= now) {
      events.push({ id: id(), kind: 'stress', ts: at(day, 21, 0).toISOString(), level: stress })
      events.push({ id: id(), kind: 'sleep', ts: at(day, 7, 5).toISOString(), hours: sleep, quality: sleep >= 7 ? 4 : sleep >= 6 ? 3 : 2 })
      if (exMin) events.push({ id: id(), kind: 'exercise', ts: at(day, 18, 0).toISOString(), minutes: exMin, type: 'Walk' })
      if (r() < .55) {
        const bucket = worst >= 6 ? 'bad' : worst >= 3 ? 'mid' : 'good'
        const text = bucket === 'bad' && snack === 'bubble_tea' ? DIARY.bad[1] : pick(r, DIARY[bucket])
        events.push({ id: id(), kind: 'diary', ts: eveningT.toISOString(), text, mood: bucket === 'good' ? 4 : bucket === 'mid' ? 3 : 2 })
      }
    } else if (d === 0) {
      // today, partial: morning check-in already done
      events.push({ id: id(), kind: 'sleep', ts: at(day, 7, 5).toISOString(), hours: 7, quality: 4 })
      events.push({ id: id(), kind: 'stress', ts: at(day, 7, 10).toISOString(), level: 2 })
    }

    // meds
    const doses = [
      { med: 'mebeverine', t: at(day, 7, 45), p: .93 },
      { med: 'mebeverine', t: at(day, 12, 15), p: .82 },
      { med: 'mebeverine', t: at(day, 18, 45), p: .62 },
      { med: 'psyllium', t: at(day, 21, 0), p: .8 },
    ]
    for (const ds of doses) {
      if (ds.t > now) continue
      const taken = r() < ds.p
      const reasons = ds.t.getHours() >= 18
        ? ['Eating out — forgot to bring it', 'Forgot', 'Eating out — forgot to bring it']
        : ['Forgot', 'Felt fine, skipped', 'Ran out at work']
      events.push({
        id: id(), kind: 'med', ts: ds.t.toISOString(), medId: ds.med, scheduled: ds.t.toISOString(),
        status: taken ? 'taken' : 'missed', reason: taken ? null : pick(r, reasons),
      })
    }
    if (worst >= 7 && r() < .5) {
      const t = at(day, 15, 0)
      if (t <= now) events.push({ id: id(), kind: 'med', ts: t.toISOString(), medId: 'loperamide', status: 'taken', prn: true })
    }
  }

  events.sort((a, b) => a.ts.localeCompare(b.ts))
  return events
}

export { FOODS }
