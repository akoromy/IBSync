import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { CalendarHeart, FileDown, X, Plus, ShieldAlert } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Card, H2, Btn, AiSource, Skeleton } from '../components/ui.jsx'
import { getDoctorQuestions } from '../ai/client.js'
const exportReport = args => import('../lib/report.js').then(m => m.exportReport(args))
import { RED_FLAG_RULES } from '../lib/analytics.js'

export default function Care() {
  const { state, ctx, dispatch, t } = useStore()
  const [qs, setQs] = useState(null)
  const [draft, setDraft] = useState('')
  const now = new Date()

  useEffect(() => {
    let live = true
    getDoctorQuestions(ctx, state.concerns, state.settings).then(r => live && setQs(r))
    return () => { live = false }
  }, [ctx, state.concerns, state.settings])

  const flags = state.profile.selfFlags || []
  const toggleFlag = id => dispatch({ type: 'profile', patch: { selfFlags: flags.includes(id) ? flags.filter(f => f !== id) : [...flags, id] } })
  const urgent = RED_FLAG_RULES.filter(r => r.urgent && (flags.includes(r.id) || ctx.redFlags.some(x => x.id === r.id)))

  const preventive = [
    { title: 'IBS review with your doctor', when: 'Every 3–6 months, or sooner if symptoms change', status: `Booked in ${state.profile.appointments[0]?.inDays} days` },
    { title: 'Medication review', when: 'At each review — is each medicine still helping?', status: 'Due at next visit' },
    { title: 'Dietitian-led FODMAP reintroduction', when: 'Elimination should last 2–6 weeks, then reintroduce', status: 'Booked' },
    { title: 'Coeliac blood test', when: 'Recommended once for IBS — do it before cutting out gluten', status: 'Ask your GP' },
    { title: 'Mood & stress check-in', when: 'Gut and mood are linked — check in monthly', status: ctx.mood.avgMood ? `Avg mood ${ctx.mood.avgMood}/5` : 'Start a diary' },
    { title: 'Bowel cancer screening (FIT)', when: 'Yearly from age 50 in Singapore', status: state.profile.age >= 50 ? 'Due — ask your GP' : `Not due until ${50 - state.profile.age} years` },
    { title: 'Flu vaccination', when: 'Yearly, recommended for adults', status: 'Check with polyclinic' },
  ]

  return (
    <div>
      <PageHeader back title={t('care')} sub="Get ready for appointments and stay ahead of check-ups." />

      <section className="px-5">
        {state.profile.appointments.map(a => (
          <div key={a.id} className="mb-2 flex items-center gap-4 rounded-[22px] bg-accent-soft p-4">
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface leading-none">
              <span className="text-[10px] font-bold text-ink-2">{format(addDays(now, a.inDays), 'MMM')}</span>
              <span className="num text-lg font-black">{format(addDays(now, a.inDays), 'd')}</span>
            </span>
            <span className="min-w-0">
              <span className="block font-extrabold">{a.title}</span>
              <span className="block text-sm text-ink-2">{a.where} · in {a.inDays} days</span>
            </span>
          </div>
        ))}
      </section>

      <section className="px-5 pt-7">
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
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add a worry or question…" className="h-12 flex-1 rounded-2xl border border-line bg-surface px-4 outline-none placeholder:text-ink-3" />
          <button aria-label="Add" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-bg"><Plus size={20} /></button>
        </form>
      </section>

      <section className="px-5 pt-7">
        <Btn className="w-full" onClick={() => exportReport({ state, ctx, questions: qs?.questions })}>
          <FileDown size={19} /> {t('exportReport')}
        </Btn>
        <p className="mt-2 text-center text-xs text-ink-3">A one-page PDF your doctor can read in 2 minutes: symptoms, stool pattern, triggers, adherence and your questions.</p>
      </section>

      <section className="px-5 pt-8">
        <H2>Check-ups & prevention</H2>
        <Card className="divide-y divide-line px-4">
          {preventive.map(p => (
            <div key={p.title} className="flex items-start gap-3 py-3.5">
              <CalendarHeart size={18} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p.title}</p>
                <p className="text-sm text-ink-2">{p.when}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-ink-2 max-w-[38%] text-right">{p.status}</span>
            </div>
          ))}
        </Card>
      </section>

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
      </section>
    </div>
  )
}
