// Lightweight tests for src/lib/analytics.js — no test framework needed.
// Run with: npm test
// Uses Node's built-in assert and dynamic import of ESM.

import assert from 'node:assert/strict'
import { foodScores, romeCheck, dailySeries } from '../src/lib/analytics.js'

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  \u2713 ${name}`)
  } catch (e) {
    console.error(`  \u2717 ${name}`)
    console.error(`    ${e.message}`)
    process.exitCode = 1
  }
}

// --- Sample data -----------------------------------------------------------

// All timestamps use ISO strings; analytics expects { ts, kind, ... }
// Meals have a `foods` array of food IDs; symptoms have `pain` 1-10.
const NOW = new Date('2025-03-28T23:59:00')

// Build 28 days of sample events: chicken rice (trigger) on some days,
// fish soup (safe) on others, plus matching symptoms and stools.
function ts(daysAgo, hour) {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const sampleEvents = []

// 14 "trigger" days: chicken rice at 12:00, pain 6 at 14:00, Bristol 6 stool at 15:00
for (let d = 1; d <= 14; d++) {
  sampleEvents.push({ ts: ts(d, 12), kind: 'meal', foods: ['chicken_rice'] })
  sampleEvents.push({ ts: ts(d, 14), kind: 'symptom', pain: 6, types: ['bloating'] })
  sampleEvents.push({ ts: ts(d, 15), kind: 'stool', bristol: 6, urgency: true })
}

// 14 "safe" days: fish soup at 12:00, pain 1 at 14:00, Bristol 4 stool at 15:00
for (let d = 15; d <= 28; d++) {
  sampleEvents.push({ ts: ts(d, 12), kind: 'meal', foods: ['fish_soup'] })
  sampleEvents.push({ ts: ts(d, 14), kind: 'symptom', pain: 1, types: ['bloating'] })
  sampleEvents.push({ ts: ts(d, 15), kind: 'stool', bristol: 4 })
}

console.log('\nAnalytics tests\n')

// --- foodScores ------------------------------------------------------------

test('foodScores returns foods sorted by diff descending', () => {
  const { foods } = foodScores(sampleEvents)
  assert.ok(foods.length >= 2, `expected >=2 foods, got ${foods.length}`)
  const trigger = foods.find(f => f.id === 'chicken_rice')
  const safe = foods.find(f => f.id === 'fish_soup')
  assert.ok(trigger, 'chicken_rice should be in results')
  assert.ok(safe, 'fish_soup should be in results')
  assert.ok(trigger.diff > safe.diff, `trigger diff (${trigger.diff}) should exceed safe diff (${safe.diff})`)
})

test('foodScores classifies trigger food as "caution" or "avoid"', () => {
  const { foods } = foodScores(sampleEvents)
  const trigger = foods.find(f => f.id === 'chicken_rice')
  assert.ok(['caution', 'avoid'].includes(trigger.verdict),
    `expected caution/avoid, got "${trigger.verdict}"`)
})

test('foodScores classifies safe food as "safe"', () => {
  const { foods } = foodScores(sampleEvents)
  const safe = foods.find(f => f.id === 'fish_soup')
  assert.equal(safe.verdict, 'safe', `expected "safe", got "${safe.verdict}"`)
})

test('foodScores returns tags with non-zero counts', () => {
  const { tags } = foodScores(sampleEvents)
  assert.ok(tags.length > 0, 'expected at least one tag')
  const garlicTag = tags.find(t => t.tag === 'garlic_onion')
  assert.ok(garlicTag, 'garlic_onion tag should be present')
  assert.ok(garlicTag.n > 0, 'tag count should be > 0')
})

test('foodScores respects override verdicts', () => {
  const { foods } = foodScores(sampleEvents, { chicken_rice: 'safe' })
  const trigger = foods.find(f => f.id === 'chicken_rice')
  assert.equal(trigger.verdict, 'safe')
  assert.equal(trigger.overridden, true)
})

test('foodScores returns empty result for no meals', () => {
  const result = foodScores([{ ts: ts(1, 12), kind: 'symptom', pain: 5 }])
  assert.deepEqual(result, { foods: [], tags: [], baseline: 0 })
})

// --- romeCheck -------------------------------------------------------------

test('romeCheck reports enough logged days', () => {
  const r = romeCheck(sampleEvents, NOW)
  assert.ok(r.enough, `expected enough=true, got ${r.enough}`)
  assert.ok(r.loggedDays >= 14, `expected >=14 logged days, got ${r.loggedDays}`)
})

test('romeCheck detects frequent pain (>=1 day/week)', () => {
  const r = romeCheck(sampleEvents, NOW)
  assert.ok(r.painFrequent, `expected painFrequent=true (perWeek=${r.perWeek})`)
})

test('romeCheck identifies defecation criterion', () => {
  const r = romeCheck(sampleEvents, NOW)
  const defecation = r.criteria.find(c => c.id === 'defecation')
  assert.ok(defecation.met, `expected defecation criterion met (defecPct should be >=30)`)
})

test('romeCheck returns consistent pattern with sufficient data', () => {
  const r = romeCheck(sampleEvents, NOW)
  assert.equal(r.pattern, 'consistent', `expected "consistent", got "${r.pattern}"`)
})

test('romeCheck returns early pattern with sparse data', () => {
  const sparse = [
    { ts: ts(1, 12), kind: 'meal', foods: ['chicken_rice'] },
    { ts: ts(1, 14), kind: 'symptom', pain: 6 },
  ]
  const r = romeCheck(sparse, NOW)
  assert.equal(r.pattern, 'early', `expected "early", got "${r.pattern}"`)
})

// --- dailySeries sanity -----------------------------------------------------

test('dailySeries produces 28 entries', () => {
  const series = dailySeries(sampleEvents, 28, NOW)
  assert.equal(series.length, 28)
})

test('dailySeries marks logged days correctly', () => {
  const series = dailySeries(sampleEvents, 28, NOW)
  const logged = series.filter(d => d.logged)
  // 14 trigger days (days 1-14) + 13 of 14 safe days (days 15-27) fall within
  // the 28-day window; day 28 is just outside the startOfDay boundary.
  assert.ok(logged.length >= 27, `expected >=27 logged days, got ${logged.length}`)
})

console.log(`\n${passed} passed, ${process.exitCode ? 'FAILED' : '0 failed'}\n`)
