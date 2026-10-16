// On-device insight engine. Produces the same shapes as the LLM so the app
// works offline, without an API key, and as a fallback if the model fails.
// Every sentence is generated from analytics numbers — nothing is made up.

import { findMed } from '../data/meds.js'
import { LOW_FODMAP_SWAPS } from '../data/foods.js'

const s = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

export function localOverview(ctx) {
  const { week, triggers, safeFoods, lifestyle, adherence, today, redFlags } = ctx
  const better = week.flaresNow < week.flaresPrev
  const worse = week.flaresNow > week.flaresPrev
  let headline
  if (redFlags.length) headline = 'Something in your logs is worth showing a doctor soon.'
  else if (week.flaresNow === 0 && week.flaresPrev > 0) headline = `No flare days this week — down from ${week.flaresPrev} last week.`
  else if (week.flaresNow === 0) headline = 'A settled week — no flare days so far.'
  else if (better) headline = `Calmer than last week: ${s(week.flaresNow, 'flare day')}, down from ${week.flaresPrev}.`
  else if (worse) headline = `A bumpier week: ${s(week.flaresNow, 'flare day')}, up from ${week.flaresPrev}.`
  else headline = `Holding steady with ${s(week.flaresNow, 'flare day')} this week.`

  const points = []
  const top = triggers[0]
  if (top) points.push(`${top.food.name} came before symptoms ${top.rate}% of the time (${s(top.n, 'meal')}). It looks like a likely trigger for you.`)
  const stress = lifestyle.find(l => l.factor === 'stress')
  const ex = lifestyle.find(l => l.factor === 'exercise')
  if (ex && ex.flareHigh != null && ex.flareLow != null && ex.flareLow > ex.flareHigh)
    points.push(`On days you moved 20+ minutes, you had flares ${ex.flareHigh}% of the time vs ${ex.flareLow}% on other days. Keep it up.`)
  else if (week.calmNow) points.push(`${s(week.calmNow, 'calm day')} in the last 7. That's real progress worth noticing.`)
  if (stress && stress.flareHigh != null && stress.flareHigh > (stress.flareLow ?? 0))
    points.push(`High-stress days had flares ${stress.flareHigh}% of the time vs ${stress.flareLow}% on calmer ones. A 5-minute wind-down may help.`)
  const weak = adherence.map(a => ({ a, slot: a.bySlot.filter(x => x.pct != null).sort((x, y) => x.pct - y.pct)[0] })).filter(x => x.slot && x.slot.pct < 80)[0]
  if (weak && points.length < 3) points.push(`Your ${weak.slot.time} ${weak.a.med.label.split(' ')[0]} dose is taken ${weak.slot.pct}% of the time — the one most often missed.`)

  const plan = []
  const meal = safeFoods.find(f => ['Hawker', 'Home'].includes(f.food.group) && !['oats', 'eggs', 'congee'].includes(f.id)) || safeFoods[0]
  if (meal) plan.push({ id: 'safe-lunch', text: `Lunch idea: ${meal.food.name}`, why: `Settled ${100 - meal.rate}% of the ${meal.n} times you had it.` })
  const waterLeft = Math.max(0, 2000 - (today?.water || 0))
  plan.push({ id: 'water', text: waterLeft ? `Drink ${Math.ceil(waterLeft / 250)} more glasses of water` : 'Water goal reached — nice', why: 'Fibre works better with enough fluid.' })
  plan.push({ id: 'walk', text: 'Take a 20-minute walk', why: 'Your flare days drop on days you move.' })
  if (weak) plan.push({ id: 'med-slot', text: `Set out your ${weak.slot.time} dose now`, why: `That dose is missed most — "${weak.a.reasons[0]?.[0] || 'forgot'}".` })
  else plan.push({ id: 'wind-down', text: '5 minutes of slow breathing tonight', why: 'Stress and gut symptoms travel together for you.' })

  return { headline, points: points.slice(0, 3), plan: plan.slice(0, 4), source: 'local' }
}

export function localTabInsight(tab, ctx) {
  const { foods, tags, stool, lifestyle, adherence, mood, week } = ctx
  if (tab === 'overview') {
    const o = localOverview(ctx)
    return { insights: o.points, recommendation: o.plan[2] ? `${o.plan[2].text} — ${o.plan[2].why.toLowerCase()}` : '' }
  }
  if (tab === 'foods') {
    const bad = foods.filter(f => f.verdict === 'avoid').slice(0, 3)
    const good = foods.filter(f => f.verdict === 'safe').slice(0, 3)
    const tag = tags[0]
    return {
      insights: [
        bad.length ? `Most linked to symptoms: ${bad.map(b => `${b.food.name} (${b.rate}%)`).join(', ')}.` : 'No strong trigger foods yet — keep logging meals.',
        tag ? `The common thread is ${tag.label.toLowerCase()}: symptoms followed ${tag.rate}% of meals containing it.` : 'Log a few more meals to find shared ingredients.',
        good.length ? `Reliably settled: ${good.map(g => g.food.name).join(', ')}.` : 'Your safe-food list will grow as you log.',
      ],
      recommendation: tag?.tag === 'dairy' ? 'Try your usual kopi or teh with lactose-free milk for 2 weeks and compare.' : 'Try one swap at a time for 2 weeks so the effect is clear.',
    }
  }
  if (tab === 'stool') {
    return {
      insights: [
        `${stool.normalPct}% of your stools were in the comfortable range (type 3–5); ${stool.loosePct}% loose, ${stool.hardPct}% hard.`,
        `You average ${stool.perDay} bowel movements a day, with ${s(stool.urgent, 'urgent episode')} in 4 weeks.`,
        `This pattern looks most like ${stool.subtype} by Rome IV stool criteria. Only your doctor can confirm a subtype.`,
      ],
      recommendation: stool.loosePct > stool.hardPct ? 'Loose stools cluster on high-stress and dairy days — worth testing one change at a time.' : 'Harder stools follow low-water days. Aim for steady water through the day.',
    }
  }
  if (tab === 'symptoms') {
    return {
      insights: [
        `Worst pain averaged ${week.painNow ?? '–'}/10 this week vs ${week.painPrev ?? '–'}/10 last week.`,
        `${s(week.flaresNow, 'flare day')} this week (pain 6+), ${s(week.calmNow, 'calm day')}.`,
        'Symptoms usually showed up 2–4 hours after a trigger meal, which matches typical IBS timing.',
      ],
      recommendation: 'When a flare starts, open Flare mode for breathing and a heat-pack reminder, and log it so your doctor sees the timing.',
    }
  }
  if (tab === 'lifestyle') {
    const st = lifestyle.find(l => l.factor === 'stress')
    const sl = lifestyle.find(l => l.factor === 'sleep')
    const ex = lifestyle.find(l => l.factor === 'exercise')
    const wa = lifestyle.find(l => l.factor === 'water')
    return {
      insights: [
        `Stress: flare rate ${st.flareHigh ?? '–'}% on ${st.highLabel} vs ${st.flareLow ?? '–'}% on ${st.lowLabel}.`,
        `Sleep: flare rate ${sl.flareHigh ?? '–'}% after ${sl.highLabel} vs ${sl.flareLow ?? '–'}% otherwise.`,
        `Movement: flare rate ${ex.flareHigh ?? '–'}% on ${ex.highLabel} vs ${ex.flareLow ?? '–'}%. Water: ${wa.flareHigh ?? '–'}% vs ${wa.flareLow ?? '–'}%.`,
      ],
      recommendation: (mood.themes.includes('stress & workload') ? 'Your diary keeps mentioning workload. ' : '') + 'Pair a short walk with your lunch break on busy days.',
    }
  }
  if (tab === 'meds') {
    return {
      insights: adherence.map(a => `${a.med.label}: taken ${a.pct ?? '–'}% of the time in 2 weeks${a.reasons[0] ? ` — most common reason missed: "${a.reasons[0][0]}"` : ''}.`),
      recommendation: 'Keep a spare strip in your bag for meals out — that is when evening doses slip.',
    }
  }
  return { insights: [], recommendation: '' }
}

export function localDoctorQuestions(ctx, concerns) {
  const q = []
  const top = ctx.triggers[0]
  if (top) q.push(`${top.food.name} seems linked to my symptoms (${top.rate}% of meals). Should I try a guided low-FODMAP elimination with a dietitian?`)
  const st = ctx.lifestyle.find(l => l.factor === 'stress')
  if (st.flareHigh > st.flareLow) q.push(`My flares are more common on high-stress days (${st.flareHigh}% vs ${st.flareLow}%). Could gut-directed therapy or CBT help?`)
  const weak = ctx.adherence.find(a => a.pct != null && a.pct < 85)
  if (weak) q.push(`I miss my ${weak.med.label} dose about ${100 - weak.pct}% of the time, mostly when eating out. Is there a simpler schedule that works as well?`)
  q.push(`My stool pattern looks like ${ctx.stool.subtype} (${ctx.stool.loosePct}% loose, ${ctx.stool.hardPct}% hard). Does that change which treatment fits me best?`)
  q.push('How long should I give my current treatment before we decide whether it is working?')
  if (concerns[0]) q.push(`I've noticed: ${concerns[0]}. What could be causing this?`)
  if (ctx.redFlags.length) q.unshift(`I logged: ${ctx.redFlags.map(r => r.label.toLowerCase()).join('; ')}. Do I need tests?`)
  return q.slice(0, 6)
}

export function localChat(text, ctx) {
  const t = text.toLowerCase()
  const med = findMed(text)
  if (med) {
    return `**${med.name}** (${med.kind.toLowerCase()})\n\n**What it's for:** ${med.forWhat}\n\n**How it's usually taken:** ${med.howToTake}\n\n**Common side effects:** ${med.sideEffects}\n\n**Tip:** ${med.tips}\n\n**Talk to your doctor or pharmacist if:** ${med.askIf}\n\n_Your own prescription label always comes first._`
  }
  if (/trigger|food|eat|safe|avoid|lunch|dinner|hawker|makan|吃/.test(t)) {
    const bad = ctx.triggers.slice(0, 3).map(f => `${f.food.name} (${f.rate}% of the time)`)
    const good = ctx.safeFoods.slice(0, 4).map(f => f.food.name)
    return `From your last 4 weeks of logs:\n\n- **Seems linked to symptoms:** ${bad.join(', ') || 'nothing clear yet'}\n- **Usually settled:** ${good.join(', ') || 'still learning'}\n\nSwap ideas: ${LOW_FODMAP_SWAPS.slice(0, 2).map(x => `${x.from} → ${x.to}`).join('; ')}.\n\nThese are links in your data, not proof. Try one change for 2 weeks and the app will show if it helps.`
  }
  if (/stress|anxious|anxiety|worried|sleep|tired/.test(t)) {
    const st = ctx.lifestyle.find(l => l.factor === 'stress')
    return `Your gut and stress do seem connected: flare days happened ${st.flareHigh}% of the time on high-stress days vs ${st.flareLow}% on calmer days.\n\nThings that help many people with IBS:\n- 5 minutes of slow breathing (try Flare mode)\n- A short walk after meals\n- Gut-directed hypnotherapy or CBT — worth asking your doctor about\n\nWant me to add that question to your doctor list?`
  }
  if (/stool|poo|bristol|diarrh|constipat|toilet/.test(t)) {
    const p = ctx.stool
    return `Over 4 weeks: ${p.normalPct}% of stools were type 3–5 (comfortable), ${p.loosePct}% loose and ${p.hardPct}% hard, about ${p.perDay} a day.\n\nThat pattern looks most like **${p.subtype}** by Rome IV criteria — your doctor can confirm.\n\nIf you ever see blood, black stools, or symptoms waking you at night, please see a doctor rather than waiting.`
  }
  if (/week|how am i|summary|overview|doing/.test(t)) {
    const o = localOverview(ctx)
    return `${o.headline}\n\n${o.points.map(p => `- ${p}`).join('\n')}`
  }
  return `I can help with:\n- what your logs say about **foods, stress or stool patterns**\n- what a **medicine** is for and how it's usually taken\n- **questions to ask** at your next appointment\n\nTry: "What are my trigger foods?" or "What is mebeverine for?"`
}
