import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { Wind, Settings2, Utensils, Activity, Droplet, NotebookPen, Check, AlertTriangle, CalendarHeart, ChevronRight, Footprints } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { useStore } from '../store.jsx'
import { getOverview } from '../ai/client.js'
import { Card, H2, AiSource, Skeleton, StatusGlyph, statusColor } from '../components/ui.jsx'
import { Pebble, BristolIcon, Logo } from '../components/art.jsx'
import { todaysDoses } from '../lib/doses.js'
import { mealSymptomLinks, statusOf } from '../lib/analytics.js'
import { foodById } from '../data/foods.js'

export default function Today() {
  const { state, dispatch, ctx, t } = useStore()
  const { openFlare } = useOutletContext()
  const nav = useNavigate()
  const [ov, setOv] = useState(null)
  const [toast, setToast] = useState(null)
  const now = new Date()

  useEffect(() => {
    let live = true
    getOverview(ctx, state.settings).then(o => live && setOv(o))
    return () => { live = false }
  }, [ctx, state.settings])

  const h = now.getHours()
  const greet = h < 5 ? t('goodEvening') : h < 12 ? t('goodMorning') : h < 18 ? t('goodAfternoon') : t('goodEvening')
  const week = ctx.series.slice(-7)
  const today = ctx.today
  const doses = todaysDoses(state.events, state.profile, now)
  const links = mealSymptomLinks(state.events, now)
  const appt = state.profile.appointments[0]

  const addWater = () => {
    dispatch({ type: 'add', event: { kind: 'water', ml: 250 } })
    setToast(`Glass of water added · ${((today.water + 250) / 1000).toFixed(2)} L today`)
    setTimeout(() => setToast(null), 2200)
  }
  const takeDose = d => dispatch({ type: 'add', event: { kind: 'med', medId: d.med.id, scheduled: d.at.toISOString(), status: 'taken' } })

  return (
    <div>
      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-black tracking-tight">IBSync</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openFlare} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-flare-soft px-3.5 text-sm font-bold text-ink hover:brightness-95">
            <Wind size={16} /> {t('flareMode')}
          </button>
          <Link to="/settings" aria-label={t('settings')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink">
            <Settings2 size={18} />
          </Link>
        </div>
      </header>

      {/* Hero: plain-language state of the gut + the week as pebbles */}
      <section className="px-5 pt-7 pb-2" aria-live="polite">
        <p className="text-[0.95rem] font-semibold text-ink-2">{greet}, {state.profile.name}</p>
        {ov ? (
          <h1 className="rise mt-1.5 text-[1.7rem] leading-[1.15] font-black tracking-[-0.02em] text-ink text-balance">{ov.headline}</h1>
        ) : (
          <div className="mt-2 space-y-2"><Skeleton className="h-7 w-11/12" /><Skeleton className="h-7 w-2/3" /></div>
        )}

        <div className="mt-5 flex items-end justify-between" role="list" aria-label={t('gutWeek')}>
          {week.map((d, i) => (
            <Link to="/timeline" state={{ day: d.key }} role="listitem" key={d.key} className="flex flex-col items-center gap-1 rounded-xl px-0.5 hover:bg-surface-2/60">
              <Pebble status={d.status} i={i} size={42} today={i === 6} label={`${format(d.date, 'EEEE')}: ${t(d.status === 'none' ? 'notLogged' : d.status)}${d.maxPain != null ? `, worst pain ${d.maxPain} of 10` : ''}`} />
              <span className={`text-[11px] font-bold ${i === 6 ? 'text-ink' : 'text-ink-3'}`}>{i === 6 ? t('today') : format(d.date, 'EEE')}</span>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs font-semibold text-ink-2">
          {['calm', 'mild', 'flare'].map(s => <span key={s} className="inline-flex items-center gap-1.5"><StatusGlyph status={s} />{t(s)}</span>)}
        </div>
      </section>

      {/* AI read-out */}
      <section className="px-5 pt-5">
        <Card className="p-5">
          {ov ? (
            <ul className="space-y-3.5">
              {ov.points.map((p, i) => (
                <li key={i} className="flex gap-3 text-[0.97rem] leading-snug">
                  <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: ['var(--accent)', 'var(--calm)', 'var(--mild)'][i % 3] }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : <div className="space-y-3"><Skeleton className="h-5" /><Skeleton className="h-5 w-5/6" /><Skeleton className="h-5 w-4/6" /></div>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
            <AiSource source={ov?.source} />
            <Link to="/insights" className="text-sm font-bold text-primary">Why? See insights</Link>
          </div>
        </Card>
      </section>

      {ctx.redFlags.length > 0 && (
        <section className="px-5 pt-4">
          <Link to="/care" className="flex gap-3 rounded-[20px] border border-flare/40 bg-flare-soft p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-flare" size={20} />
            <div>
              <p className="font-extrabold">Worth checking with a doctor</p>
              <p className="text-sm text-ink-2">{ctx.redFlags.map(r => r.label).join('; ')}. Tap to prepare a summary.</p>
            </div>
          </Link>
        </section>
      )}

      {/* Plan for today */}
      <section className="px-5 pt-7">
        <H2>{t('planToday')}</H2>
        <div className="space-y-2">
          {(ov?.plan || []).map(p => {
            const done = !!state.planDone[`${today.key}:${p.id}`]
            return (
              <button key={p.id} onClick={() => dispatch({ type: 'plan', id: `${today.key}:${p.id}` })}
                className="flex w-full items-start gap-3 rounded-2xl px-1 py-2 text-left hover:bg-surface-2/60" aria-pressed={done}>
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${done ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface'}`}>
                  {done && <Check size={16} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className={`block font-bold ${done ? 'text-ink-3 line-through' : ''}`}>{p.text}</span>
                  <span className="block text-sm text-ink-2">{p.why}</span>
                </span>
              </button>
            )
          })}
          {!ov && <><Skeleton className="h-12" /><Skeleton className="h-12" /></>}
        </div>
      </section>

      {/* Quick log */}
      <section className="pt-7">
        <H2 className="px-5">{t('quickLog')}</H2>
        <div className="scroll-x flex gap-2.5 px-5 pb-1">
          {[
            { label: t('meal'), icon: Utensils, to: '/log?tab=meal' },
            { label: t('feel'), icon: Activity, to: '/log?tab=feel' },
            { label: t('stool'), icon: null, to: '/log?tab=stool' },
            { label: t('diary'), icon: NotebookPen, to: '/log?tab=diary' },
            { label: t('exercise'), icon: Footprints, to: '/log?tab=body' },
          ].map(q => (
            <button key={q.label} onClick={() => nav(q.to)} className="flex h-[88px] w-[84px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[20px] bg-surface-2 text-sm font-bold hover:brightness-[.97]">
              {q.icon ? <q.icon size={24} className="text-ink-2" /> : <BristolIcon type={4} size={30} color="var(--ink-2)" />}
              {q.label}
            </button>
          ))}
          <button onClick={addWater} className="flex h-[88px] w-[84px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[20px] bg-primary-soft text-sm font-bold hover:brightness-[.97]">
            <Droplet size={24} className="text-primary" />
            +1 glass
          </button>
        </div>
      </section>

      {/* Today at a glance: body numbers */}
      <section className="grid grid-cols-3 gap-2.5 px-5 pt-5">
        <Meter label={t('water')} value={`${(today.water / 1000).toFixed(1)}L`} pct={today.water / state.profile.waterGoal} sub={`of ${state.profile.waterGoal / 1000}L`} />
        <Meter label={t('exercise')} value={`${today.exercise}m`} pct={today.exercise / state.profile.exerciseGoal} sub={`of ${state.profile.exerciseGoal} min`} />
        <Meter label={t('stool')} value={today.stools} pct={null} sub={today.bristol ? `avg type ${today.bristol}` : 'none yet'} />
      </section>

      {/* Meds */}
      <section className="px-5 pt-7">
        <H2 action={<Link to="/meds" className="text-sm font-bold text-primary">{t('seeAll')}</Link>}>{t('medsDue')}</H2>
        <div className="space-y-2">
          {doses.map(d => (
            <div key={d.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="num w-12 text-sm font-extrabold text-ink-2">{d.time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.med.label}</p>
                <p className="truncate text-xs text-ink-2">{d.med.note}</p>
              </div>
              {d.status === 'taken' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-calm-soft px-3 py-1.5 text-xs font-bold"><Check size={14} /> {t('taken')}</span>
              ) : d.status === 'missed' ? (
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink-2">{t('missed')}</span>
              ) : (
                <button onClick={() => takeDose(d)} className={`rounded-full px-3.5 py-2 text-xs font-extrabold ${d.status === 'due' ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink'}`}>
                  {t('markTaken')}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Today's meal → symptom links */}
      <section className="px-5 pt-7">
        <H2 action={<Link to="/timeline" className="text-sm font-bold text-primary">{t('timeline')}</Link>}>Today so far</H2>
        <TodayFeed events={state.events} links={links} />
      </section>

      {/* Care nudge */}
      {appt && (
        <section className="px-5 pt-7">
          <Link to="/care" className="flex items-center gap-4 rounded-[22px] bg-accent-soft p-4 hover:brightness-[.98]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-accent"><CalendarHeart size={24} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold">{appt.title}</span>
              <span className="block text-sm text-ink-2">In {appt.inDays} days · {format(addDays(now, appt.inDays), 'EEE d MMM')}. {t('doctorPrep')}.</span>
            </span>
            <ChevronRight className="text-ink-3" />
          </Link>
        </section>
      )}

      <p className="px-6 pt-6 text-center text-xs text-ink-3">{t('aiNote')}</p>

      {toast && <div role="status" className="rise fixed inset-x-0 bottom-28 z-40 mx-auto w-fit rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-bg shadow-soft">{toast}</div>}
    </div>
  )
}

function Meter({ label, value, pct, sub }) {
  return (
    <div className="rounded-[20px] bg-surface border border-line px-3.5 py-3">
      <p className="text-xs font-bold text-ink-2">{label}</p>
      <p className="num mt-0.5 text-[1.35rem] font-black leading-tight">{value}</p>
      {pct != null ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(Math.min(1, pct) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct * 100)}%` }} />
        </div>
      ) : <div className="mt-2 h-1.5" />}
      <p className="mt-1.5 text-[11px] text-ink-3">{sub}</p>
    </div>
  )
}

export function TodayFeed({ events, links, day = new Date() }) {
  const k = format(day, 'yyyy-MM-dd')
  const items = events.filter(e => e.ts.slice(0, 10) === k || format(parseISO(e.ts), 'yyyy-MM-dd') === k)
    .filter(e => ['meal', 'symptom', 'stool', 'diary'].includes(e.kind))
  if (!items.length) return <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-2">Nothing logged yet today. Tap + to add your first meal or check-in.</p>
  const linkedSym = new Set(links.flatMap(l => l.linked.map(s => s.id)))
  return (
    <ol className="relative ml-2 border-l-2 border-line pl-5">
      {items.map(e => {
        const time = format(parseISO(e.ts), 'h:mm a')
        const link = e.kind === 'meal' ? links.find(l => l.meal.id === e.id) : null
        let dot = 'var(--ink-3)', title = '', sub = ''
        if (e.kind === 'meal') { title = e.foods.map(f => foodById[f]?.name || f).join(', '); sub = e.slot || 'Meal'; dot = 'var(--accent)' }
        if (e.kind === 'symptom') { const s = statusOf(e.pain); dot = statusColor(s); title = `${(e.types || []).join(', ') || 'Symptoms'}`; sub = `Pain ${e.pain}/10${linkedSym.has(e.id) ? ' · likely linked to a meal' : ''}` }
        if (e.kind === 'stool') { title = `Stool · type ${e.bristol}`; sub = e.urgency ? 'Urgent' : ''; dot = 'var(--ink-2)' }
        if (e.kind === 'diary') { title = 'Diary'; sub = e.text; dot = 'var(--primary)' }
        return (
          <li key={e.id} className="relative pb-4 last:pb-0">
            <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-bg" style={{ background: dot }} />
            <p className="text-xs font-bold text-ink-3 num">{time}</p>
            <p className="font-bold capitalize-first">{title}</p>
            {sub && <p className="text-sm text-ink-2">{sub}</p>}
            {link && <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-mild-soft px-2.5 py-1 text-xs font-bold">→ {link.linked.map(s => (s.types || [])[0]).join(', ')} {Math.round((parseISO(link.linked[0].ts) - parseISO(e.ts)) / 3600000 * 10) / 10}h later</p>}
          </li>
        )
      })}
    </ol>
  )
}
