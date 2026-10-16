import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Lightbulb, Sparkles, Utensils, Activity, Moon, ChevronRight } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Card, H2, AiSource, Skeleton, StatusGlyph } from '../components/ui.jsx'
import { Pebble, BristolIcon } from '../components/art.jsx'
import { PainTrend, SmallLine, BristolBars, HBars } from '../components/charts.jsx'
import { getTabInsight } from '../ai/client.js'
import { LOW_FODMAP_SWAPS } from '../data/foods.js'

const StoolGlyph = ({ size = 22, color = 'currentColor' }) => <BristolIcon type={4} size={size + 6} color={color} />

// Each section has its own colour, icon and plain-language purpose,
// so people always know where they are.
const SECTIONS = {
  overview: { icon: Sparkles, c: 'var(--primary)', soft: 'var(--primary-soft)', label: 'Overview', title: 'Your big picture', blurb: 'How the last 4 weeks fit together.' },
  foods: { icon: Utensils, c: 'var(--accent)', soft: 'var(--accent-soft)', label: 'Foods', title: 'Food & triggers', blurb: 'Which foods tend to come before your symptoms.' },
  stool: { icon: StoolGlyph, c: 'var(--mild)', soft: 'var(--mild-soft)', label: 'Stool', title: 'Bowel habits', blurb: 'How often you go, and what it looks like.' },
  symptoms: { icon: Activity, c: 'var(--flare)', soft: 'var(--flare-soft)', label: 'Symptoms', title: 'Pain & symptoms', blurb: 'How strong, how often, and when.' },
  lifestyle: { icon: Moon, c: 'var(--sky)', soft: 'var(--sky-soft)', label: 'Lifestyle', title: 'Stress, sleep & movement', blurb: 'The everyday things that shift your gut.' },
}

function headlineStat(tab, ctx) {
  if (tab === 'overview') return [`${ctx.week.calmNow}`, 'calm days this week']
  if (tab === 'foods') { const t = ctx.tags[0]; return t ? [t.label, `strongest link · ${t.rate}% of meals`] : ['—', 'keep logging meals'] }
  if (tab === 'stool') return [`${ctx.stool.normalPct}%`, `comfortable (type 3–5) · ${ctx.stool.perDay}/day`]
  if (tab === 'symptoms') return [`${ctx.series.filter(d => d.maxPain >= 6).length}`, 'flare days in 4 weeks']
  const top = [...ctx.lifestyle].filter(l => l.flareHigh != null && l.flareLow != null).sort((a, b) => Math.abs(b.flareHigh - b.flareLow) - Math.abs(a.flareHigh - a.flareLow))[0]
  return top ? [top.factor[0].toUpperCase() + top.factor.slice(1), 'has the strongest link to your flares'] : ['—', 'keep logging']
}

export default function Insights() {
  const { t, ctx } = useStore()
  const [tab, setTab] = useState('overview')
  const S = SECTIONS[tab]
  const [big, small] = headlineStat(tab, ctx)
  return (
    <div>
      <PageHeader title={t('insights')} sub="Find the bigger picture in your logs." />

      <div role="tablist" aria-label="Insight sections" className="scroll-x flex gap-1.5 px-5">
        {Object.entries(SECTIONS).map(([id, x]) => {
          const on = tab === id
          return (
            <button key={id} role="tab" aria-selected={on} onClick={() => setTab(id)}
              className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition ${on ? 'font-bold' : 'border-line bg-surface font-semibold text-ink-2 hover:text-ink'}`}
              style={on ? { background: x.soft, borderColor: x.c, color: 'var(--ink)' } : undefined}>
              <x.icon size={15} strokeWidth={2.3} color={on ? x.c : 'currentColor'} />{x.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' ? <ClearestPattern onGo={setTab} /> : (
        <section key={tab} className="rise mx-5 mt-5 overflow-hidden rounded-[26px]" style={{ background: S.soft }}>
          <div className="flex items-start gap-4 p-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px]" style={{ background: S.c }}>
              <S.icon size={28} strokeWidth={2.2} color="var(--surface)" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[1.35rem] leading-tight">{S.title}</h2>
              <p className="text-sm text-ink-2">{S.blurb}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-t px-5 py-3.5" style={{ borderColor: 'color-mix(in srgb, var(--ink) 8%, transparent)' }}>
            <span className="num font-display text-xl font-bold leading-tight">{big}</span>
            <span className="text-sm font-semibold text-ink-2">{small}</span>
          </div>
        </section>
      )}

      <div className="space-y-7 px-5 pt-5">
        {tab === 'overview' && <Overview />}
        {tab === 'foods' && <Foods />}
        {tab === 'stool' && <Stool />}
        {tab === 'symptoms' && <Symptoms />}
        {tab === 'lifestyle' && <Lifestyle />}
      </div>
    </div>
  )
}

function AiInsight({ tab }) {
  const { ctx, state } = useStore()
  const [ins, setIns] = useState(null)
  const S = SECTIONS[tab]
  useEffect(() => {
    let live = true
    getTabInsight(tab, ctx, state.settings).then(r => live && setIns(r))
    return () => { live = false }
  }, [tab, ctx, state.settings])
  return (
    <section className="rounded-[22px] border border-line bg-surface p-5 shadow-soft" style={{ borderTop: `4px solid ${S.c}` }} aria-label={`AI read on ${S.title}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-2 font-extrabold"><Sparkles size={16} color={S.c} />What IBSync noticed</p>
        {ins && <AiSource source={ins.source} />}
      </div>
      {ins ? (
        <>
          <ol className="space-y-3">
            {ins.insights.map((x, i) => (
              <li key={i} className="flex gap-3 leading-snug">
                <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: S.soft, color: 'var(--ink)' }}>{i + 1}</span>
                <span>{x}</span>
              </li>
            ))}
          </ol>
          {ins.recommendation && (
            <div className="mt-4 flex gap-3 rounded-2xl p-3.5" style={{ background: S.soft }}>
              <Lightbulb size={19} className="mt-0.5 shrink-0" color={S.c} />
              <p className="text-[0.95rem] leading-snug"><span className="font-extrabold">Try this: </span>{ins.recommendation}</p>
            </div>
          )}
        </>
      ) : <div className="space-y-2.5"><Skeleton className="h-5" /><Skeleton className="h-5 w-5/6" /><Skeleton className="h-5 w-4/6" /></div>}
    </section>
  )
}

function Stat({ label, now, prev, unit = '', lowerBetter = true }) {
  const diff = prev != null && now != null ? +(now - prev).toFixed(1) : null
  const good = diff != null && (lowerBetter ? diff < 0 : diff > 0)
  return (
    <div className="rounded-[20px] border border-line bg-surface p-3.5">
      <p className="text-xs font-bold text-ink-2">{label}</p>
      <p className="num mt-1 text-2xl font-bold">{now ?? '–'}{unit}</p>
      {diff != null && diff !== 0 && <p className={`text-xs font-bold ${good ? 'text-calm' : 'text-flare'}`}>{diff > 0 ? '▲' : '▼'} {Math.abs(diff)}{unit} vs last week</p>}
      {diff === 0 && <p className="text-xs font-bold text-ink-3">same as last week</p>}
    </div>
  )
}

// The single strongest, plain-language finding — links to the tab that explains it.
function ClearestPattern({ onGo }) {
  const { ctx } = useStore()
  const tag = ctx.tags[0]
  const life = [...ctx.lifestyle].filter(l => l.flareHigh != null && l.flareLow != null)
    .sort((a, b) => (b.flareHigh - b.flareLow) - (a.flareHigh - a.flareLow))[0]
  const lifeText = life && life.flareHigh > life.flareLow ? { sleep: 'on days after short sleep', stress: 'on high-stress days', exercise: 'on days you moved 20+ minutes', water: 'on days with more water' }[life.factor] : null
  const lifeLow = life && life.flareLow > life.flareHigh ? { exercise: 'on days you didn\'t move much', water: 'on days with less water', sleep: 'after longer sleep', stress: 'on calmer days' }[life.factor] : null
  const parts = [tag && tag.diff > .5 ? `after ${tag.label.toLowerCase().replace(' (lactose)', '')} meals` : null, lifeText || lifeLow].filter(Boolean)
  const text = parts.length ? `Symptoms were more common ${parts.join(' and ')}.` : 'Keep logging. Your clearest pattern will show up here.'
  return (
    <button onClick={() => onGo(tag && tag.diff > .5 ? 'foods' : 'lifestyle')} className="rise mx-5 mt-5 flex w-[calc(100%-2.5rem)] items-center gap-4 rounded-[26px] bg-primary-soft p-5 text-left">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><Lightbulb size={26} /></span>
      <span className="min-w-0 flex-1">
        <span className="font-display block text-[1.3rem] font-bold leading-tight">Your clearest pattern</span>
        <span className="mt-1 block text-ink-2">{text}</span>
      </span>
      <ChevronRight className="shrink-0 text-ink-3" />
    </button>
  )
}

function Overview() {
  const { ctx, t } = useStore()
  const [range, setRange] = useState(28)
  const w = ctx.week
  const data = ctx.series.slice(-range)
  const sl = ctx.lifestyle.find(l => l.factor === 'sleep')
  return (
    <>
      <section className="rounded-[24px] border border-line bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.15rem] leading-tight">Symptoms and sleep over time</h2>
            <p className="text-sm text-ink-2">How your daily symptoms and sleep line up.</p>
          </div>
          <select value={range} onChange={e => setRange(+e.target.value)} aria-label="Time range" className="h-9 shrink-0 rounded-full border border-line bg-surface px-3 text-sm font-semibold">
            <option value={14}>2 weeks</option><option value={28}>4 weeks</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1"><span className="h-2 w-2 rounded-full bg-accent" />Worst pain (0–10)</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-soft px-2.5 py-1"><span className="h-2 w-2 rounded-full bg-sky" />Sleep (hours)</span>
        </div>
        <div className="mt-2"><PainTrend data={data} height={130} /></div>
        <div className="-mt-1"><SmallLine data={data} dataKey="sleep" name="Sleep" unit="h" domain={[4, 9]} color="var(--sky)" height={96} /></div>
        {sl && sl.flareHigh != null && sl.flareHigh > (sl.flareLow ?? 0) && (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-sky-soft px-3.5 py-3">
            <Moon size={18} className="shrink-0 text-sky" />
            <p className="text-sm">After nights under 6.5 hours, you had a flare <strong>{sl.flareHigh}%</strong> of the time, vs {sl.flareLow}% otherwise.</p>
          </div>
        )}
      </section>
      <AiInsight tab="overview" />
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Flare days" now={w.flaresNow} prev={w.flaresPrev} />
        <Stat label="Avg worst pain" now={w.painNow} prev={w.painPrev} />
        <Stat label="Calm days" now={w.calmNow} prev={null} />
      </div>
      <section>
        <H2>28 days at a glance</H2>
        <Card className="p-4">
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-ink-3">
            {ctx.series.slice(0, 7).map(d => <span key={d.key}>{format(d.date, 'EEEEE')}</span>)}
          </div>
          <div className="grid grid-cols-7 place-items-center gap-y-1">
            {ctx.series.map((d, i) => <Pebble key={d.key} status={d.status} i={i} size={38} today={i === ctx.series.length - 1} label={`${d.label}: ${t(d.status === 'none' ? 'notLogged' : d.status)}`} />)}
          </div>
          <div className="mt-3 flex gap-4 text-xs font-semibold text-ink-2">
            {['calm', 'mild', 'flare'].map(s => <span key={s} className="inline-flex items-center gap-1.5"><StatusGlyph status={s} />{t(s)}</span>)}
          </div>
        </Card>
      </section>
    </>
  )
}

const VERDICTS = ['avoid', 'caution', 'safe']

function Foods() {
  const { ctx, dispatch, t } = useStore()
  const triggers = ctx.foods.filter(f => f.verdict === 'avoid' || f.verdict === 'caution')
  const safe = ctx.foods.filter(f => f.verdict === 'safe')
  const learning = ctx.foods.filter(f => ['learning', 'neutral'].includes(f.verdict))
  const cycle = f => {
    const i = VERDICTS.indexOf(f.verdict)
    const next = f.overridden && i === VERDICTS.length - 1 ? null : VERDICTS[(i + 1) % VERDICTS.length]
    dispatch({ type: 'foodOverride', id: f.id, verdict: next })
  }
  const Row = ({ f }) => (
    <li className="flex items-center gap-3 py-2.5">
      <span className="text-2xl" aria-hidden>{f.food.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{f.food.name}</p>
        <p className="text-xs text-ink-2">Symptoms after {f.reactions} of {f.n} times · FODMAP {f.food.fodmap}</p>
      </div>
      <button onClick={() => cycle(f)} title="Tap to change" className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-ink"
        style={{ background: { avoid: 'var(--flare-soft)', caution: 'var(--mild-soft)', safe: 'var(--calm-soft)' }[f.verdict] || 'var(--surface-2)' }}>
        {t(f.verdict)}{f.overridden ? ' ✎' : ''}
      </button>
    </li>
  )
  return (
    <>
      <AiInsight tab="foods" />
      <section>
        <H2>Likely triggers</H2>
        <Card className="px-4 py-1"><ul className="divide-y divide-line">{triggers.map(f => <Row key={f.id} f={f} />)}</ul></Card>
      </section>
      <section>
        <H2>Usually fine for you</H2>
        <Card className="px-4 py-1"><ul className="divide-y divide-line">{safe.map(f => <Row key={f.id} f={f} />)}</ul></Card>
      </section>
      <section>
        <H2>Ingredients behind it</H2>
        <Card className="p-4">
          <HBars rows={ctx.tags.map(tg => ({ label: tg.label, value: tg.rate, note: `${tg.n} meals`, color: tg.diff >= 1.5 ? 'var(--flare)' : tg.diff >= .6 ? 'var(--mild)' : 'var(--calm)' }))} />
          <p className="mt-3 text-xs text-ink-3">% of meals containing this that were followed by symptoms within 6 hours. Your average across all meals: {Math.round(ctx.foods.reduce((s, f) => s + f.reactions, 0) / Math.max(1, ctx.foods.reduce((s, f) => s + f.n, 0)) * 100)}%.</p>
        </Card>
      </section>
      {learning.length > 0 && (
        <section>
          <H2>Still learning</H2>
          <p className="text-sm text-ink-2">{learning.map(f => f.food.name).join(', ')} — not enough meals or no clear effect yet.</p>
        </section>
      )}
      <section>
        <H2>Gentle swaps</H2>
        <ul className="space-y-2">
          {LOW_FODMAP_SWAPS.map(s => (
            <li key={s.from} className="rounded-2xl bg-surface-2 p-3.5 text-sm"><span className="text-ink-2">{s.from}</span><br /><span className="font-bold">Try: {s.to}</span></li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-3">Food links are patterns in your logs, not a diagnosis. A dietitian can guide a proper low-FODMAP elimination and reintroduction.</p>
      </section>
    </>
  )
}

function Stool() {
  const { ctx } = useStore()
  const s = ctx.stool
  return (
    <>
      <AiInsight tab="stool" />
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Comfortable</p><p className="num text-2xl font-bold">{s.normalPct}%</p><p className="text-xs text-ink-3">type 3–5</p></div>
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Per day</p><p className="num text-2xl font-bold">{s.perDay}</p><p className="text-xs text-ink-3">average</p></div>
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Pattern</p><p className="text-2xl font-bold">{s.subtype}</p><p className="text-xs text-ink-3">Rome IV</p></div>
      </div>
      <section>
        <H2>Bristol type, last 28 days</H2>
        <Card className="p-3 pt-4">
          <BristolBars dist={s.dist} />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs font-semibold text-ink-2">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" />Harder (1–2)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-calm" />Comfortable (3–5)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-mild" />Looser (6–7)</span>
          </div>
        </Card>
      </section>
      <section>
        <H2>Average type by day</H2>
        <Card className="p-3 pt-4"><SmallLine data={ctx.series} dataKey="bristol" name="Avg Bristol type" domain={[1, 7]} color="var(--accent)" height={140} /></Card>
      </section>
      <p className="text-xs text-ink-3">How the pattern is worked out: Rome IV groups IBS by the share of hard (type 1–2) vs loose (type 6–7) stools. Yours: {s.hardPct}% hard, {s.loosePct}% loose. Only a doctor can confirm a subtype.</p>
    </>
  )
}

function Symptoms() {
  const { state, ctx } = useStore()
  const since = Date.now() - 28 * 864e5
  const sym = state.events.filter(e => e.kind === 'symptom' && new Date(e.ts) >= since)
  const counts = {}
  for (const s of sym) for (const ty of s.types || []) counts[ty] = (counts[ty] || 0) + 1
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), value: v, color: 'var(--accent)' }))
  const tod = [['Morning', 5, 12], ['Afternoon', 12, 17], ['Evening', 17, 22], ['Night', 22, 29]].map(([label, a, b]) => ({
    label, value: sym.filter(s => { const h = new Date(s.ts).getHours(); const hh = h < 5 ? h + 24 : h; return hh >= a && hh < b }).length, color: 'var(--primary)',
  }))
  return (
    <>
      <AiInsight tab="symptoms" />
      <section>
        <H2>Worst pain each day</H2>
        <Card className="p-3 pt-4"><PainTrend data={ctx.series} /></Card>
      </section>
      <section>
        <H2>What you feel most</H2>
        <Card className="p-4"><HBars rows={rows} max={Math.max(...rows.map(r => r.value), 1)} unit="" /></Card>
      </section>
      <section>
        <H2>When symptoms show up</H2>
        <Card className="p-4"><HBars rows={tod} max={Math.max(...tod.map(r => r.value), 1)} unit="" /></Card>
      </section>
    </>
  )
}

function Lifestyle() {
  const { ctx, state } = useStore()
  const L = Object.fromEntries(ctx.lifestyle.map(l => [l.factor, l]))
  const Compare = ({ l, title }) => (
    <div className="rounded-[20px] border border-line bg-surface p-4">
      <p className="font-extrabold">{title}</p>
      <div className="mt-3 space-y-2.5">
        {[[l.highLabel, l.flareHigh, l.nHigh], [l.lowLabel, l.flareLow, l.nLow]].map(([lab, v, n], i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm"><span>{lab}</span><span className="num font-bold">{v ?? '–'}% flare days <span className="font-normal text-ink-3">({n}d)</span></span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full" style={{ width: `${Math.max(3, v || 0)}%`, background: (v || 0) >= 40 ? 'var(--flare)' : (v || 0) >= 15 ? 'var(--mild)' : 'var(--calm)' }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <>
      <AiInsight tab="lifestyle" />
      <section className="space-y-2.5">
        <H2>Flare days, side by side</H2>
        <Compare l={L.stress} title="Stress" />
        <Compare l={L.sleep} title="Sleep" />
        <Compare l={L.exercise} title="Movement" />
        <Compare l={L.water} title="Water" />
      </section>
      <section className="space-y-2.5">
        <H2>Trends</H2>
        <Card className="p-3 pt-3"><p className="px-2 pb-1 text-sm font-bold">Stress (1–5)</p><SmallLine data={ctx.series} dataKey="stress" name="Stress" domain={[1, 5]} color="var(--accent)" /></Card>
        <Card className="p-3 pt-3"><p className="px-2 pb-1 text-sm font-bold">Sleep (hours)</p><SmallLine data={ctx.series} dataKey="sleep" name="Sleep" unit="h" domain={[4, 9]} /></Card>
        <Card className="p-3 pt-3"><p className="px-2 pb-1 text-sm font-bold">Water (ml)</p><SmallLine data={ctx.series} dataKey="water" name="Water" unit=" ml" goal={state.profile.waterGoal} domain={[0, 2600]} /></Card>
        <Card className="p-3 pt-3"><p className="px-2 pb-1 text-sm font-bold">Movement (min)</p><SmallLine data={ctx.series} dataKey="exercise" name="Movement" unit=" min" goal={state.profile.exerciseGoal} domain={[0, 60]} /></Card>
      </section>
      {ctx.mood.entries > 0 && (
        <section>
          <H2>From your diary</H2>
          <Card tone="soft" className="p-4">
            <p className="text-sm">Average mood <strong>{ctx.mood.avgMood}/5</strong> across {ctx.mood.entries} entries in 2 weeks.</p>
            {ctx.mood.themes.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{ctx.mood.themes.map(th => <span key={th} className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold">{th}</span>)}</div>}
            {ctx.mood.latest && <p className="mt-3 border-l-2 border-line pl-3 text-sm italic text-ink-2">“{ctx.mood.latest.text}”</p>}
          </Card>
        </section>
      )}
      <p className="text-xs text-ink-3">Comparisons show association across your own days, not cause. Correlation with worst pain: stress r={L.stress.r}, sleep r={L.sleep.r}, movement r={L.exercise.r}, water r={L.water.r}.</p>
    </>
  )
}
