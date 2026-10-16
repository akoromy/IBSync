import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Lightbulb } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Segmented, Card, H2, AiSource, Skeleton, StatusGlyph } from '../components/ui.jsx'
import { Pebble } from '../components/art.jsx'
import { PainTrend, SmallLine, BristolBars, HBars } from '../components/charts.jsx'
import { getTabInsight } from '../ai/client.js'
import { LOW_FODMAP_SWAPS } from '../data/foods.js'

export default function Insights() {
  const { t } = useStore()
  const [tab, setTab] = useState('overview')
  return (
    <div>
      <PageHeader title={t('insights')} sub="What your last 4 weeks of logs are telling you." />
      <div className="px-5">
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'overview', label: t('overview') }, { value: 'foods', label: t('foods') }, { value: 'stool', label: t('stool') },
          { value: 'symptoms', label: t('symptoms') }, { value: 'lifestyle', label: t('lifestyle') },
        ]} />
      </div>
      <div className="space-y-7 px-5 pt-6">
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
  useEffect(() => {
    let live = true
    setIns(null)
    getTabInsight(tab, ctx, state.settings).then(r => live && setIns(r))
    return () => { live = false }
  }, [tab, ctx, state.settings])
  return (
    <Card tone="primary" className="p-5">
      {ins ? (
        <>
          <ul className="space-y-2.5">
            {ins.insights.map((x, i) => <li key={i} className="flex gap-2.5 leading-snug"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{x}</li>)}
          </ul>
          {ins.recommendation && (
            <div className="mt-4 flex gap-2.5 rounded-2xl bg-surface p-3.5">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-[0.95rem] font-semibold leading-snug">{ins.recommendation}</p>
            </div>
          )}
          <AiSource source={ins.source} className="mt-3" />
        </>
      ) : <div className="space-y-2.5"><Skeleton className="h-5 bg-surface" /><Skeleton className="h-5 w-5/6 bg-surface" /><Skeleton className="h-5 w-4/6 bg-surface" /></div>}
    </Card>
  )
}

function Stat({ label, now, prev, unit = '', lowerBetter = true }) {
  const diff = prev != null && now != null ? +(now - prev).toFixed(1) : null
  const good = diff != null && (lowerBetter ? diff < 0 : diff > 0)
  return (
    <div className="rounded-[20px] border border-line bg-surface p-3.5">
      <p className="text-xs font-bold text-ink-2">{label}</p>
      <p className="num mt-1 text-2xl font-black">{now ?? '–'}{unit}</p>
      {diff != null && diff !== 0 && <p className={`text-xs font-bold ${good ? 'text-calm' : 'text-flare'}`}>{diff > 0 ? '▲' : '▼'} {Math.abs(diff)}{unit} vs last week</p>}
      {diff === 0 && <p className="text-xs font-bold text-ink-3">same as last week</p>}
    </div>
  )
}

function Overview() {
  const { ctx, t } = useStore()
  const w = ctx.week
  return (
    <>
      <AiInsight tab="overview" />
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Flare days" now={w.flaresNow} prev={w.flaresPrev} />
        <Stat label="Avg worst pain" now={w.painNow} prev={w.painPrev} />
        <Stat label="Calm days" now={w.calmNow} prev={null} />
      </div>
      <section>
        <H2>Worst pain each day</H2>
        <Card className="p-3 pt-4"><PainTrend data={ctx.series} /></Card>
      </section>
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
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Comfortable</p><p className="num text-2xl font-black">{s.normalPct}%</p><p className="text-xs text-ink-3">type 3–5</p></div>
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Per day</p><p className="num text-2xl font-black">{s.perDay}</p><p className="text-xs text-ink-3">average</p></div>
        <div className="rounded-[20px] border border-line bg-surface p-3.5"><p className="text-xs font-bold text-ink-2">Pattern</p><p className="text-2xl font-black">{s.subtype}</p><p className="text-xs text-ink-3">Rome IV</p></div>
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
