import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { Wind, Settings2, Utensils, Activity, Droplet, NotebookPen, Check, AlertTriangle, ChevronRight, ChevronDown, Footprints, ClipboardList, Moon, Flame, Sparkles, Info } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { whenLabel } from './Care.jsx'
import { useStore } from '../store.jsx'
import { getOverview } from '../ai/client.js'
import { H2, AiSource, Skeleton, statusColor } from '../components/ui.jsx'
import { Pebble, BristolIcon, Logo, FlareRing } from '../components/art.jsx'
import { todaysDoses } from '../lib/doses.js'
import { mealSymptomLinks, statusOf } from '../lib/analytics.js'
import { foodById } from '../data/foods.js'

const FACTOR_ICON = { symptoms: Activity, stool: null, movement: Footprints, sleep: Moon }
const goodColor = g => g >= .75 ? 'var(--calm)' : g >= .5 ? 'var(--mild)' : 'var(--flare)'

export default function Today() {
  const { state, dispatch, ctx, t } = useStore()
  const { openFlare } = useOutletContext()
  const nav = useNavigate()
  const [ov, setOv] = useState(null)
  const [toast, setToast] = useState(null)
  const [why, setWhy] = useState(false)
  const [morePlan, setMorePlan] = useState(false)
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
  const appt = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date))[0]
  const suspected = state.profile.status === 'suspected'
  const W = ctx.weather
  const riskWord = { low: 'Low', moderate: 'Moderate', high: 'High' }[W.level]
  const w = ctx.week
  const trend = w.painPrev == null || w.painNow == null ? 'Keep logging to see how this week compares.'
    : w.painNow < w.painPrev - .3 ? 'Your symptoms are lighter than last week.'
    : w.painNow > w.painPrev + .3 ? 'Symptoms are a little higher than last week.'
    : 'About the same as last week.'
  const plan = (ov?.plan || []).map(p => ({ ...p, key: `${today.key}:${p.id}`, done: !!state.planDone[`${today.key}:${p.id}`] }))
  const next = plan.find(p => !p.done)

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
          <span className="font-display text-[1.2rem] font-bold">IBSync</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openFlare} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary-soft px-3.5 text-sm font-bold text-primary hover:brightness-95">
            <Wind size={16} /> {t('flareMode')}
          </button>
          <Link to="/settings" aria-label={t('settings')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink">
            <Settings2 size={18} />
          </Link>
        </div>
      </header>

      <section className="px-5 pt-6" aria-live="polite">
        <p className="text-[0.95rem] text-ink-2">{greet}, {state.profile.name}.</p>
        <h1 className="rise mt-1 text-[2.1rem] leading-[1.05] text-ink">{{ low: 'Looking calm today.', moderate: 'A mixed few days.', high: 'Your gut needs some care.' }[W.level]}</h1>
        {ov ? <p className="mt-2 text-ink-2">{ov.headline} {trend}</p> : <Skeleton className="mt-2 h-5 w-4/5" />}
      </section>

      {/* Gut weather: 7-day ring + the factors behind it */}
      <section className="px-5 pt-5">
        <div className="rounded-[26px] border border-line bg-surface p-4 shadow-soft">
          <div className="flex items-center gap-4">
            <FlareRing value={1 - W.score} level={W.level} size={150}>
              <span className="font-display text-[1.25rem] font-bold leading-tight" style={{ color: W.level === 'low' ? 'var(--primary)' : W.level === 'moderate' ? 'var(--mild)' : 'var(--flare)' }}>{riskWord}<br />flare risk</span>
              <span className="mt-1 text-[11px] leading-tight text-ink-2">Based on your<br />last 7 days</span>
            </FlareRing>
            <ul className="min-w-0 flex-1 space-y-3">
              {W.factors.map(f => {
                const I = FACTOR_ICON[f.id]
                return (
                  <li key={f.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 font-semibold">{I ? <I size={14} className="text-ink-2" /> : <BristolIcon type={4} size={16} color="var(--ink-2)" />}{f.label}</span>
                      <span className="text-[11px] font-bold text-ink-2">{f.word}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="meter" aria-label={`${f.label}: ${f.word}`} aria-valuenow={Math.round(f.good * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(6, f.good * 100)}%`, background: goodColor(f.good) }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-line px-1 pt-3" role="list" aria-label={t('gutWeek')}>
            {week.map((d, i) => (
              <Link to="/timeline" state={{ day: d.key }} role="listitem" key={d.key} className="flex flex-col items-center gap-0.5 rounded-xl px-1 hover:bg-surface-2/60">
                <Pebble status={d.status} i={i} size={26} label={`${format(d.date, 'EEEE')}: ${t(d.status === 'none' ? 'notLogged' : d.status)}${d.maxPain != null ? `, worst pain ${d.maxPain} of 10` : ''}`} />
                <span className={`text-[11px] ${i === 6 ? 'font-black text-ink' : 'font-semibold text-ink-3'}`}>{i === 6 ? t('today') : format(d.date, 'EEE')}</span>
              </Link>
            ))}
          </div>
          <button onClick={() => setWhy(x => !x)} aria-expanded={why} className="mt-2 inline-flex items-center gap-1 px-1 text-xs font-bold text-ink-2 hover:text-ink"><Info size={13} />How is this worked out?</button>
          {why && (
            <div className="rise mt-2 rounded-2xl bg-surface-2 p-3.5 text-sm">
              <p>The fuller the ring, the more settled your last 7 days have been. Flare risk mostly reflects your symptoms, nudged by stool, stress, sleep and movement:</p>
              <ul className="mt-2 space-y-1 text-ink-2">{W.factors.map(f => <li key={f.id}>• <strong className="text-ink">{f.label}:</strong> {f.detail}</li>)}</ul>
              <p className="mt-2 text-xs text-ink-3">A guide from your own logs, not a medical prediction.</p>
            </div>
          )}
        </div>
      </section>

      {/* Streak + next best action */}
      <section className="space-y-2.5 px-5 pt-3">
        <Link to="/timeline" className="flex items-center gap-3.5 rounded-[22px] border border-line bg-surface px-4 py-3.5 shadow-soft">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent"><Flame size={22} /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold"><span className="text-accent">{ctx.streak}-day streak</span></span>
            <span className="block text-sm text-ink-2">{ctx.streak >= 7 ? 'You\'ve logged every day this week. That\'s what makes patterns clear.' : 'Log something today to keep it going.'}</span>
          </span>
          <ChevronRight size={18} className="text-ink-3" />
        </Link>

        {next ? (
          <div className="rounded-[22px] border border-line bg-surface shadow-soft">
            <button onClick={() => dispatch({ type: 'plan', id: next.key })} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Sparkles size={20} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-ink-2">Your next best step</span>
                <span className="block font-bold leading-snug">{next.text}</span>
                <span className="block text-sm text-ink-2">{next.why}</span>
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line" aria-label="Mark done"><Check size={15} className="text-ink-3" /></span>
            </button>
            {plan.length > 1 && (
              <div className="border-t border-line">
                <button onClick={() => setMorePlan(x => !x)} aria-expanded={morePlan} className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-ink-2">
                  {t('planToday')} · {plan.filter(p => p.done).length}/{plan.length} done
                  <ChevronDown size={16} className={`transition ${morePlan ? 'rotate-180' : ''}`} />
                </button>
                {morePlan && (
                  <ul className="rise space-y-1 px-3 pb-3">
                    {plan.map(p => (
                      <li key={p.id}>
                        <button onClick={() => dispatch({ type: 'plan', id: p.key })} aria-pressed={p.done} className="flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left hover:bg-surface-2/60">
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${p.done ? 'border-primary bg-primary text-primary-ink' : 'border-line'}`}>{p.done && <Check size={13} strokeWidth={3} />}</span>
                          <span className={`text-sm ${p.done ? 'text-ink-3 line-through' : 'font-semibold'}`}>{p.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : ov && (
          <p className="rounded-[22px] bg-primary-soft px-4 py-3.5 font-bold text-primary">All of today's plan is done. Nice work.</p>
        )}
      </section>

      {suspected && (
        <section className="px-5 pt-3">
          <Link to="/care" className="block rounded-[22px] bg-primary-soft p-4 hover:brightness-[.98]">
            <span className="flex items-center gap-2 font-bold"><ClipboardList size={18} className="text-primary" />Building your diary for the doctor</span>
            <span className="mt-2 flex items-baseline justify-between text-sm"><span><strong className="num text-lg">{ctx.rome.loggedDays}</strong> of {ctx.rome.target} days logged</span><span className="font-bold text-primary">See what it shows</span></span>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ctx.rome.loggedDays / ctx.rome.target * 100)}%` }} /></span>
          </Link>
        </section>
      )}

      {ctx.redFlags.length > 0 && (
        <section className="px-5 pt-3">
          <Link to="/care" className="flex gap-3 rounded-[20px] border border-flare/40 bg-flare-soft p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-flare" size={20} />
            <div>
              <p className="font-bold">Worth checking with a doctor</p>
              <p className="text-sm text-ink-2">{ctx.redFlags.map(r => r.label).join('; ')}. Tap to prepare a summary.</p>
            </div>
          </Link>
        </section>
      )}

      {/* Quick log */}
      <section className="px-5 pt-7">
        <H2>{t('quickLog')}</H2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: t('meal'), icon: Utensils, to: '/log?tab=meal', bg: 'var(--primary-soft)', c: 'var(--primary)' },
            { label: t('feel'), icon: Activity, to: '/log?tab=feel', bg: 'var(--accent-soft)', c: 'var(--accent)' },
            { label: t('stool'), icon: null, to: '/log?tab=stool', bg: 'var(--mild-soft)', c: 'var(--mild)' },
            { label: t('exercise'), icon: Footprints, to: '/log?tab=body', bg: 'var(--sky-soft)', c: 'var(--sky)' },
          ].map(q => (
            <button key={q.label} onClick={() => nav(q.to)} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[20px] text-[13px] font-bold transition hover:brightness-[.97]" style={{ background: q.bg }}>
              {q.icon ? <q.icon size={24} color={q.c} /> : <BristolIcon type={4} size={30} color={q.c} />}
              <span className="text-ink">{q.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-2.5">
          <Droplet size={18} className="text-sky" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-[13px]"><span className="font-semibold">{t('water')}</span><span className="num text-ink-2">{(today.water / 1000).toFixed(1)} / {state.profile.waterGoal / 1000} L</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-sky" style={{ width: `${Math.min(100, today.water / state.profile.waterGoal * 100)}%` }} /></div>
          </div>
          <button onClick={addWater} className="rounded-full bg-sky-soft px-3 py-1.5 text-xs font-bold text-ink">+ glass</button>
          <Link to="/log?tab=diary" aria-label={t('diary')} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink-2"><NotebookPen size={15} /></Link>
        </div>
      </section>

      {/* AI read-out */}
      <section className="px-5 pt-7">
        <H2 action={<Link to="/insights" className="text-sm font-bold text-primary">See insights</Link>}>What IBSync noticed</H2>
        <div className="rounded-[22px] border border-line bg-surface p-4 shadow-soft">
          {ov ? (
            <ul className="space-y-3">
              {ov.points.map((p, i) => (
                <li key={i} className="flex gap-3 text-[0.95rem] leading-snug">
                  <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: ['var(--accent)', 'var(--calm)', 'var(--sky)'][i % 3] }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : <div className="space-y-3"><Skeleton className="h-5" /><Skeleton className="h-5 w-5/6" /></div>}
          <AiSource source={ov?.source} className="mt-3" />
        </div>
      </section>

      {/* Meds */}
      {doses.length > 0 && <section className="px-5 pt-7">
        <H2 action={<Link to="/meds" className="text-sm font-bold text-primary">{t('seeAll')}</Link>}>{t('medsDue')}</H2>
        <div className="space-y-2">
          {doses.map(d => (
            <div key={d.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="num w-12 text-sm font-bold text-ink-2">{d.time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{d.med.label}</p>
                <p className="truncate text-xs text-ink-2">{d.med.note}</p>
              </div>
              {d.status === 'taken' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-calm-soft px-3 py-1.5 text-xs font-bold"><Check size={14} /> {t('taken')}</span>
              ) : d.status === 'missed' ? (
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink-2">{t('missed')}</span>
              ) : (
                <button onClick={() => takeDose(d)} className={`rounded-full px-3.5 py-2 text-xs font-bold ${d.status === 'due' ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink'}`}>{t('markTaken')}</button>
              )}
            </div>
          ))}
        </div>
      </section>}

      <section className="px-5 pt-7">
        <H2 action={<Link to="/timeline" className="text-sm font-bold text-primary">{t('timeline')}</Link>}>Today so far</H2>
        <TodayFeed events={state.events} links={links} />
      </section>

      {appt && (
        <section className="px-5 pt-7">
          <Link to="/care" className="flex items-center gap-4 rounded-[22px] bg-primary p-4 text-primary-ink hover:brightness-105">
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 leading-none">
              <span className="text-[10px] font-bold opacity-80">{format(parseISO(appt.date), 'MMM')}</span>
              <span className="num font-display text-lg font-bold">{format(parseISO(appt.date), 'd')}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{appt.title}</span>
              <span className="block text-sm opacity-85">{whenLabel(appt.date)}. Your visit pass is ready.</span>
            </span>
            <ChevronRight className="opacity-70" />
          </Link>
        </section>
      )}

      <p className="px-6 pt-6 text-center text-xs text-ink-3">{t('aiNote')}</p>

      {toast && <div role="status" className="rise fixed inset-x-0 bottom-28 z-40 mx-auto w-fit rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-bg shadow-soft">{toast}</div>}
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
