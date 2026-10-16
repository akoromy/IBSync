import { useEffect, useRef, useState } from 'react'
import { format, parseISO, differenceInCalendarDays, addDays } from 'date-fns'
import { CalendarHeart, FileDown, X, Plus, ShieldAlert, Stethoscope, FlaskConical, Syringe, Bell, Check, Pencil, Trash2, Repeat, CircleCheck, Circle, ClipboardList, Activity, BarChart3, Pill, ArrowRight, MapPin, Info, ShieldCheck } from 'lucide-react'
import { useStore, uid } from '../store.jsx'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../components/Layout.jsx'
import { Card, H2, Btn, AiSource, Skeleton, Chip } from '../components/ui.jsx'
import { getDoctorQuestions } from '../ai/client.js'
import { RED_FLAG_RULES, summaryLines } from '../lib/analytics.js'
import { BristolIcon } from '../components/art.jsx'

const exportReport = args => import('../lib/report.js').then(m => m.exportReport(args))

export const KINDS = {
  appointment: { icon: CalendarHeart, label: 'Appointment' },
  checkup: { icon: Stethoscope, label: 'Check-up' },
  test: { icon: FlaskConical, label: 'Test' },
  vaccine: { icon: Syringe, label: 'Vaccination' },
  reminder: { icon: Bell, label: 'Reminder' },
}
const REPEAT = { none: 'One-off', '3m': 'Every 3 months', '6m': 'Every 6 months', '12m': 'Every year' }

export function whenLabel(date) {
  const d = differenceInCalendarDays(parseISO(date), new Date())
  if (d < 0) return `${-d} day${d === -1 ? '' : 's'} overdue`
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  return `In ${d} days`
}

export default function Care() {
  const { state, ctx, dispatch, t } = useStore()
  const [qs, setQs] = useState(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null) // item | {prefill} | null
  const { search } = useLocation()
  useEffect(() => {
    const sec = new URLSearchParams(search).get('s')
    if (!sec) return
    const id = setTimeout(() => document.getElementById(sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
    return () => clearTimeout(id)
  }, [search])
  const [preview, setPreview] = useState(false)
  const draftRef = useRef(null)
  const suspected = state.profile.status === 'suspected'

  useEffect(() => {
    let live = true
    getDoctorQuestions(ctx, state.concerns, state.settings).then(r => live && setQs(r))
    return () => { live = false }
  }, [ctx, state.concerns, state.settings])

  const flags = state.profile.selfFlags || []
  const toggleFlag = id => dispatch({ type: 'profile', patch: { selfFlags: flags.includes(id) ? flags.filter(f => f !== id) : [...flags, id] } })
  const urgent = RED_FLAG_RULES.filter(r => r.urgent && (flags.includes(r.id) || ctx.redFlags.some(x => x.id === r.id)))
  const schedule = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date))
  const has = re => schedule.some(s => re.test(s.title))

  const suggestions = (suspected ? [
    { kind: 'appointment', title: 'GP visit — talk about gut symptoms', why: 'Bring your diary summary. A GP can check for IBS and rule out other causes.', repeat: 'none', match: /gp/i },
    { kind: 'test', title: 'Blood tests (incl. coeliac screen)', why: 'Often the first step. Keep eating gluten until the coeliac test is done.', repeat: 'none', match: /blood|coeliac/i },
    { kind: 'reminder', title: 'Two-week diary check', why: 'Look over your logs before the GP visit.', repeat: 'none', match: /diary/i },
  ] : [
    { kind: 'appointment', title: 'IBS review with your doctor', why: 'Every 3–6 months, or sooner if symptoms change.', repeat: '6m', match: /review|gp/i },
    { kind: 'checkup', title: 'Medication review', why: 'Is each medicine still helping? Ask your GP or pharmacist.', repeat: '6m', match: /medication review/i },
    { kind: 'appointment', title: 'Dietitian — FODMAP reintroduction', why: 'Elimination should last 2–6 weeks, then reintroduce with guidance.', repeat: 'none', match: /dietitian/i },
    { kind: 'test', title: 'Coeliac blood test', why: 'Recommended once for IBS — before cutting out gluten.', repeat: 'none', match: /coeliac/i },
  ]).concat([
    { kind: 'reminder', title: 'Mood & stress check-in', why: 'Gut and mood are linked. A monthly check-in helps.', repeat: '3m', match: /mood/i },
    { kind: 'vaccine', title: 'Flu vaccination', why: 'Yearly, recommended for adults.', repeat: '12m', match: /flu/i },
    ...(state.profile.age >= 50 ? [{ kind: 'test', title: 'Bowel cancer screening (FIT)', why: 'Yearly from age 50 in Singapore.', repeat: '12m', match: /fit|screening/i }] : []),
  ]).filter(s => !has(s.match))

  return (
    <div>
      <PageHeader back title={t('care')} sub={suspected ? 'Turn your logs into answers at your GP visit.' : 'Get ready for appointments and stay ahead of check-ups.'} />

      <div id="visit" className="scroll-mt-4" />
      <VisitPass appt={schedule.find(x => x.kind === 'appointment') || schedule[0]} questions={qs?.questions || []}
        onReview={() => setPreview(true)}
        onAddQuestion={() => { draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => draftRef.current?.focus(), 350) }}
        onAddVisit={() => setEditing({ prefill: { kind: 'appointment', title: suspected ? 'GP visit — talk about gut symptoms' : 'GP review', repeat: 'none' } })} />

      {suspected && <DiagnosisDiary />}

      <section id="schedule" className="scroll-mt-4 px-5">
        <H2 action={!editing && <button onClick={() => setEditing({})} className="inline-flex items-center gap-1 text-sm font-bold text-primary"><Plus size={16} />Add</button>}>Your schedule</H2>
        {editing && <ItemForm item={editing.id ? editing : null} prefill={editing.prefill} onClose={() => setEditing(null)} />}
        {schedule.length === 0 && !editing && <p className="rounded-2xl bg-surface-2 p-4 text-sm text-ink-2">Nothing scheduled. Add an appointment, test or check-up — or pick one of the suggestions below.</p>}
        <div className="space-y-2">
          {schedule.filter(x => x.id !== editing?.id).map(x => {
            const K = KINDS[x.kind] || KINDS.appointment
            const overdue = differenceInCalendarDays(parseISO(x.date), new Date()) < 0
            return (
              <div key={x.id} className={`rounded-[22px] p-4 ${overdue ? 'border border-flare/40 bg-flare-soft' : 'bg-accent-soft'}`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface leading-none">
                    <span className="text-[10px] font-bold text-ink-2">{format(parseISO(x.date), 'MMM')}</span>
                    <span className="num text-lg font-black">{format(parseISO(x.date), 'd')}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold leading-snug">{x.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-2">
                      <span className="inline-flex items-center gap-1"><K.icon size={13} />{whenLabel(x.date)}{x.time ? `, ${x.time}` : ''}</span>
                      {x.where && <span>· {x.where}</span>}
                      {x.repeat !== 'none' && <span className="inline-flex items-center gap-1">· <Repeat size={12} />{REPEAT[x.repeat].toLowerCase()}</span>}
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex gap-1.5 pl-16">
                  <button onClick={() => dispatch({ type: 'doneItem', id: x.id })} className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-bold"><Check size={14} />{x.repeat !== 'none' ? 'Done — schedule next' : 'Done'}</button>
                  <button onClick={() => setEditing(x)} aria-label={`Edit ${x.title}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-ink-2 hover:bg-surface"><Pencil size={13} />Edit</button>
                  <button onClick={() => dispatch({ type: 'removeItem', id: x.id })} aria-label={`Delete ${x.title}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-ink-2 hover:bg-surface"><Trash2 size={13} /></button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section id="questions" className="scroll-mt-4 px-5 pt-7">
        <H2>Questions to bring</H2>
        <Card className="p-4">
          {qs ? (
            <ol className="space-y-3">
              {qs.questions.map((q, i) => (
                <li key={i} className="flex gap-3"><span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-black text-primary">{i + 1}</span><span className="leading-snug">{q}</span></li>
              ))}
            </ol>
          ) : <div className="space-y-2.5"><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-5 w-4/5" /></div>}
          <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3"><AiSource source={qs?.source} /><span className="text-[11px] text-ink-3">· built from your logs and notes</span></div>
        </Card>
      </section>

      <section className="px-5 pt-7">
        <H2>Things you've noticed</H2>
        <ul className="space-y-2">
          {state.concerns.map((c, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3">
              <span className="flex-1 text-[0.95rem]">{c}</span>
              <button aria-label="Remove" onClick={() => dispatch({ type: 'concerns', list: state.concerns.filter((_, j) => j !== i) })} className="text-ink-3 hover:text-ink"><X size={18} /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={e => { e.preventDefault(); if (draft.trim()) { dispatch({ type: 'concerns', list: [...state.concerns, draft.trim()] }); setDraft('') } }} className="mt-2 flex gap-2">
          <input ref={draftRef} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a worry or question…" className="h-12 flex-1 rounded-2xl border border-line bg-surface px-4 outline-none placeholder:text-ink-3" />
          <button aria-label="Add" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-bg"><Plus size={20} /></button>
        </form>
      </section>

      <section id="report" className="scroll-mt-4 px-5 pt-7">
        <Btn className="w-full" onClick={() => exportReport({ state, ctx, questions: qs?.questions })}>
          <FileDown size={19} /> {suspected ? 'Download symptom diary for my GP' : t('exportReport')}
        </Btn>
        <p className="mt-2 text-center text-xs text-ink-3">A one-page PDF your doctor can read in 2 minutes{suspected ? ': how often, how bad, stool pattern, possible triggers and your questions.' : ': symptoms, stool pattern, triggers, adherence and your questions.'}</p>
      </section>

      {suggestions.length > 0 && (
        <section className="px-5 pt-8">
          <H2>Suggested for you</H2>
          <Card className="divide-y divide-line px-4">
            {suggestions.map(s => {
              const K = KINDS[s.kind]
              return (
                <div key={s.title} className="flex items-start gap-3 py-3.5">
                  <K.icon size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{s.title}</p>
                    <p className="text-sm text-ink-2">{s.why}</p>
                  </div>
                  <button onClick={() => { setEditing({ prefill: s }); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold"><Plus size={13} />Add</button>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      <section className="px-5 pt-8">
        <H2>Have you noticed any of these?</H2>
        <p className="mb-3 text-sm text-ink-2">These aren't typical of IBS and should be checked by a doctor. Tick any that apply — they'll go on your summary.</p>
        <div className="space-y-2">
          {RED_FLAG_RULES.map(r => {
            const on = flags.includes(r.id)
            return (
              <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${on ? 'border-flare/50 bg-flare-soft' : 'border-line bg-surface'}`}>
                <input type="checkbox" checked={on} onChange={() => toggleFlag(r.id)} className="h-5 w-5 accent-[var(--flare)]" />
                <span className="text-[0.95rem]">{r.label}</span>
              </label>
            )
          })}
        </div>
        {urgent.length > 0 && (
          <div className="rise mt-3 flex gap-3 rounded-2xl border border-flare/50 bg-flare-soft p-4">
            <ShieldAlert className="shrink-0 text-flare" />
            <p className="text-sm"><strong>Please see a doctor today.</strong> If symptoms are severe or sudden, call <strong>995</strong> or go to the nearest A&E.</p>
          </div>
        )}
        <p className="mt-6 flex gap-2.5 rounded-2xl bg-surface-2 p-3.5 text-xs text-ink-2"><Info size={16} className="shrink-0" />Your summary isn't a diagnosis. It's a record of your symptoms and patterns to support the conversation with your doctor or pharmacist.</p>
      </section>
      {preview && <SummaryPreview questions={qs?.questions || []} onClose={() => setPreview(false)} />}
    </div>
  )
}

function ItemForm({ item, prefill, onClose }) {
  const { dispatch } = useStore()
  const base = item || prefill || {}
  const [title, setTitle] = useState(base.title || '')
  const [kind, setKind] = useState(base.kind || 'appointment')
  const [date, setDate] = useState(item?.date || format(addDays(new Date(), 7), 'yyyy-MM-dd'))
  const [time, setTime] = useState(item?.time || '')
  const [where, setWhere] = useState(item?.where || '')
  const [repeat, setRepeat] = useState(base.repeat || 'none')
  const save = () => {
    dispatch({ type: 'saveItem', item: { id: item?.id || uid('s_'), kind, title: title.trim(), date, time, where: where.trim(), repeat } })
    onClose()
  }
  return (
    <div className="rise mb-3 rounded-[22px] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-extrabold">{item ? 'Edit' : 'Add to schedule'}</p>
        <button aria-label="Close" onClick={onClose} className="text-ink-3 hover:text-ink"><X size={20} /></button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(KINDS).map(([k, v]) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{v.label}</Chip>)}
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-bold text-ink-2">What is it?</span>
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. GP review, blood test, colonoscopy" className="mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none focus:border-ink-3" />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block"><span className="text-sm font-bold text-ink-2">Date</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="num mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-3 outline-none" /></label>
        <label className="block"><span className="text-sm font-bold text-ink-2">Time <span className="font-normal text-ink-3">(optional)</span></span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="num mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-3 outline-none" /></label>
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-bold text-ink-2">Where <span className="font-normal text-ink-3">(optional)</span></span>
        <input value={where} onChange={e => setWhere(e.target.value)} placeholder="e.g. Queenstown Polyclinic" className="mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none" />
      </label>
      <p className="mt-3 mb-1.5 text-sm font-bold text-ink-2">Repeats</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(REPEAT).map(([k, v]) => <Chip key={k} on={repeat === k} onClick={() => setRepeat(k)}>{v}</Chip>)}
      </div>
      <Btn className="mt-4 w-full" disabled={!title.trim() || !date} onClick={save}>{item ? 'Save changes' : 'Add to schedule'}</Btn>
    </div>
  )
}

function DiagnosisDiary() {
  const { ctx } = useStore()
  const r = ctx.rome
  const pct = Math.min(100, Math.round(r.loggedDays / r.target * 100))
  const summary = {
    early: 'Keep logging. About two weeks of entries gives a GP a much clearer picture.',
    partial: 'Your diary shows some of the patterns doctors ask about. Bring it to your GP — they\'ll ask about your history and may suggest tests.',
    consistent: 'Your diary shows the kind of pattern doctors look for when they consider IBS. Only a doctor can diagnose it, often after simple tests to rule out other causes.',
  }[r.pattern]
  return (
    <section className="px-5 pb-7">
      <div className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-soft">
        <div className="bg-primary-soft p-5">
          <p className="inline-flex items-center gap-2 font-extrabold"><ClipboardList size={18} className="text-primary" />Your diary for the doctor</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="num text-2xl font-black">{r.loggedDays}<span className="text-base text-ink-2"> / {r.target} days</span></span>
            <span className="text-sm font-bold text-ink-2">{r.enough ? 'Ready to share' : 'Keep going'}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm font-bold text-ink-2">What GPs usually ask about</p>
          <ul className="mt-2 space-y-3">
            <li className="flex gap-3">
              {r.painFrequent ? <CircleCheck size={20} className="mt-0.5 shrink-0 text-primary" /> : <Circle size={20} className="mt-0.5 shrink-0 text-ink-3" />}
              <span><span className="block font-bold">Tummy pain most weeks</span><span className="text-sm text-ink-2">About {r.perWeek} day{r.perWeek === 1 ? '' : 's'} a week with pain 3/10 or more</span></span>
            </li>
            {r.criteria.map(c => (
              <li key={c.id} className="flex gap-3">
                {c.met ? <CircleCheck size={20} className="mt-0.5 shrink-0 text-primary" /> : <Circle size={20} className="mt-0.5 shrink-0 text-ink-3" />}
                <span><span className="block font-bold">{c.label}</span><span className="text-sm text-ink-2">{c.detail}</span></span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl bg-surface-2 p-3.5 text-sm leading-snug">{summary}</p>
          <p className="mt-3 text-xs text-ink-3">Based on the Rome IV symptom criteria doctors use. Rome IV also needs symptoms for at least 3 months, which only your doctor can confirm. This is not a diagnosis.</p>
        </div>
      </div>
    </section>
  )
}

// A "boarding pass" for the next visit: when/where on top, what to bring below.
function VisitPass({ appt, questions, onReview, onAddQuestion, onAddVisit }) {
  const { ctx, state } = useStore()
  const L = summaryLines(ctx)
  const days = appt ? differenceInCalendarDays(parseISO(appt.date), new Date()) : null
  const checks = [
    { ok: ctx.rome.loggedDays >= 14, text: `${ctx.rome.loggedDays} days logged` },
    { ok: questions.length + state.concerns.length > 0, text: `${questions.length + state.concerns.length} questions ready` },
    { ok: (state.profile.selfFlags || []).length > 0 || ctx.redFlags.length === 0, text: ctx.redFlags.length ? 'Warning signs flagged' : 'No warning signs logged' },
  ]
  const rows = [
    { icon: Activity, bg: 'var(--accent-soft)', c: 'var(--accent)', title: 'Symptoms', text: L.symptoms },
    { icon: null, bg: 'var(--mild-soft)', c: 'var(--mild)', title: 'Bowel habits', text: L.bowel },
    { icon: BarChart3, bg: 'var(--primary-soft)', c: 'var(--primary)', title: 'Possible patterns', text: L.patterns },
    ...(L.meds ? [{ icon: Pill, bg: 'var(--sky-soft)', c: 'var(--sky)', title: 'Medicines', text: L.meds }] : []),
  ]
  return (
    <section className="px-5 pb-7">
      <div className="overflow-hidden rounded-[26px] border border-line bg-surface shadow-soft">
        <div className="bg-primary px-5 pb-5 pt-4 text-primary-ink">
          <p className="text-sm font-semibold opacity-80">Your next visit</p>
          {appt ? (
            <>
              <p className="font-display mt-1 text-[1.35rem] font-bold leading-tight">{appt.title}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="font-display num text-[1.6rem] font-bold leading-none">{format(parseISO(appt.date), 'EEE d MMM')}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-sm opacity-85">
                    {appt.time && <span>{appt.time}</span>}
                    {appt.where && <span className="inline-flex items-center gap-1"><MapPin size={13} />{appt.where}</span>}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">{days <= 0 ? 'Today' : `in ${days} day${days === 1 ? '' : 's'}`}</span>
              </div>
            </>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-display text-[1.25rem] font-bold leading-tight">No visit booked yet</p>
              <button onClick={onAddVisit} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">Add visit</button>
            </div>
          )}
        </div>
        {/* perforation */}
        <div className="relative h-0" aria-hidden>
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-line bg-bg" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-line bg-bg" />
          <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-line" />
        </div>
        <div className="p-5 pt-6">
          <p className="font-display text-[1.1rem] font-bold">Ready for your GP</p>
          <p className="text-sm text-ink-2">Your last 4 weeks, in one summary.</p>
          <ul className="mt-4 space-y-3.5">
            {rows.map(r => (
              <li key={r.title} className="flex gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: r.bg }}>
                  {r.icon ? <r.icon size={18} color={r.c} /> : <BristolIcon type={4} size={22} color={r.c} />}
                </span>
                <span><span className="block font-bold">{r.title}</span><span className="block text-sm text-ink-2">{r.text}</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {checks.map(c => (
              <span key={c.text} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${c.ok ? 'bg-calm-soft' : 'bg-mild-soft'}`}>
                {c.ok ? <Check size={12} /> : <Circle size={10} />}{c.text}
              </span>
            ))}
          </div>
          <Btn className="mt-5 h-[52px] w-full rounded-full" onClick={onReview}>Review summary <ArrowRight size={18} /></Btn>
          <button onClick={onAddQuestion} className="mt-2 w-full py-2 text-center font-bold text-primary">Add a question</button>
        </div>
      </div>
    </section>
  )
}

// In-app version of the doctor summary, so it can be shown on the phone in the consult room.
function SummaryPreview({ questions, onClose }) {
  const { state, ctx } = useStore()
  const L = summaryLines(ctx)
  const suspected = state.profile.status === 'suspected'
  const s = ctx.stool
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])
  const Sec = ({ title, children }) => <section className="border-t border-line py-4"><h3 className="mb-2 text-sm font-bold text-primary">{title}</h3><div className="space-y-1.5 text-[0.95rem]">{children}</div></section>
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Doctor summary">
      <div className="mx-auto mt-6 min-h-[calc(100%-1.5rem)] max-w-[460px] rounded-t-[28px] bg-surface px-5 pb-28 pt-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-2"><ShieldCheck size={16} className="text-primary" />Show this to your doctor</span>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2"><X size={18} /></button>
        </div>
        <h2 className="mt-4 text-[1.5rem] leading-tight">{suspected ? 'Symptom diary for GP assessment' : 'IBS summary for my doctor'}</h2>
        <p className="text-sm text-ink-2">{state.profile.name} · age {state.profile.age} · {suspected ? 'not yet diagnosed' : `${state.profile.subtype}`} · last 28 days, self-reported</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[[ctx.series.filter(d => d.maxPain >= 6).length, 'flare days'], [`${s.normalPct}%`, 'stools type 3–5'], [`${ctx.rome.perWeek}`, 'pain days / week']].map(([v, k]) => (
            <div key={k} className="rounded-2xl bg-surface-2 py-3"><p className="font-display num text-xl font-bold">{v}</p><p className="text-[11px] font-semibold text-ink-2">{k}</p></div>
          ))}
        </div>
        {ctx.redFlags.length > 0 && <Sec title="Warning signs reported">{ctx.redFlags.map(r => <p key={r.id} className="font-bold text-flare">• {r.label}</p>)}</Sec>}
        {suspected && <Sec title="Rome IV symptom criteria (diary, not a diagnosis)">{ctx.rome.criteria.map(c => <p key={c.id}>{c.met ? '✓' : '○'} {c.label} — <span className="text-ink-2">{c.detail}</span></p>)}</Sec>}
        <Sec title="Symptoms"><p>{L.symptoms}</p></Sec>
        <Sec title="Bowel habits"><p>{L.bowel} Hard {s.hardPct}% · comfortable {s.normalPct}% · loose {s.loosePct}%. Pattern: {s.subtype} (for clinician confirmation).</p></Sec>
        <Sec title="Possible triggers">{ctx.triggers.slice(0, 4).map(f => <p key={f.id}>• {f.food.name} — symptoms after {f.reactions} of {f.n} meals</p>)}<p className="text-sm text-ink-2">{L.patterns}</p></Sec>
        {L.meds && <Sec title="Medicines (14 days)"><p>{L.meds}</p></Sec>}
        <Sec title="Questions">{questions.map((q, i) => <p key={i}>{i + 1}. {q}</p>)}{state.concerns.map((c, i) => <p key={'c' + i}>• {c}</p>)}</Sec>
        <p className="border-t border-line pt-4 text-xs text-ink-3">Generated by IBSync from self-tracking. Associations are not causes. Not a diagnostic document.</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-[460px] bg-gradient-to-t from-surface via-surface to-transparent px-5 pb-6 pt-6">
          <Btn className="h-[52px] w-full rounded-full" onClick={() => exportReport({ state, ctx, questions })}><FileDown size={18} />Download PDF</Btn>
        </div>
      </div>
    </div>
  )
}
