import { useState } from 'react'
import { Stethoscope, Search, CalendarDays, BarChart3, UserRound, ArrowRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Logo } from './art.jsx'
import { Btn } from './ui.jsx'
import { LANGS } from '../i18n.js'

// First run: (1) what IBSync does, as a three-stop journey; (2) name + situation.
export default function Welcome() {
  const { state, dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(state.profile.name)
  const [status, setStatus] = useState(null)

  const OPTIONS = [
    { id: 'diagnosed', icon: Stethoscope, title: "I've been diagnosed with IBS", sub: 'Find my triggers, keep medicines on track and have better check-ups.' },
    { id: 'suspected', icon: Search, title: 'I think I might have IBS', sub: 'Build a clear symptom diary to show a doctor and get answers.' },
  ]

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col px-6 pb-8 pt-8">
        <div className="flex items-center justify-between">
          {step === 1
            ? <button onClick={() => setStep(0)} className="inline-flex items-center gap-1 text-sm font-bold text-ink-2"><ArrowLeft size={16} />Back</button>
            : <div className="flex items-center gap-2"><Logo size={30} /><span className="font-display text-xl font-bold">IBSync</span></div>}
          <select aria-label="Language" value={state.settings.lang} onChange={e => dispatch({ type: 'settings', patch: { lang: e.target.value } })}
            className="h-10 rounded-full border border-line bg-surface px-3 text-sm font-semibold">
            {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        {step === 0 ? (
          <>
            <h1 id="welcome-title" className="mt-10 text-[2.5rem] leading-[1.05]">Welcome{name ? `, ${name}` : ''}.</h1>
            <p className="mt-3 text-[1.15rem] font-semibold">Small daily logs. Clearer conversations.</p>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2">Track what matters, notice useful patterns, and go to your next GP visit with a clear picture of your gut health.</p>
            <Journey />
            <div className="mt-auto pt-4">
              <Btn className="h-14 w-full rounded-full text-lg" onClick={() => setStep(1)}>Start my journey <ArrowRight size={20} /></Btn>
            </div>
          </>
        ) : (
          <>
            <h1 id="welcome-title" className="mt-8 text-[2rem] leading-[1.1]">A little about you</h1>
            <label className="mt-6 block">
              <span className="text-sm font-bold text-ink-2">What should we call you?</span>
              <input value={name} onChange={e => setName(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-lg font-semibold outline-none focus:border-ink-3" />
            </label>
            <p className="mt-6 text-sm font-bold text-ink-2">Which sounds most like you?</p>
            <div className="mt-2 space-y-2.5">
              {OPTIONS.map(o => (
                <button key={o.id} onClick={() => setStatus(o.id)} aria-pressed={status === o.id}
                  className={`flex w-full items-start gap-4 rounded-[22px] border-2 p-4 text-left transition ${status === o.id ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:border-ink-3'}`}>
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status === o.id ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink-2'}`}><o.icon size={22} /></span>
                  <span><span className="block text-[1.05rem] font-bold leading-snug">{o.title}</span><span className="mt-0.5 block text-sm text-ink-2">{o.sub}</span></span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-8">
              <Btn className="h-14 w-full rounded-full text-lg" disabled={!status} onClick={() => dispatch({ type: 'onboard', status, name: name.trim() })}>Let's go</Btn>
              <p className="mt-3 text-center text-xs text-ink-3">We've added 4 weeks of sample logs so you can explore. Clear them anytime in Settings. IBSync doesn't diagnose — it helps you and your doctor see the full picture.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Log → Notice → Share, drawn as a winding path over soft circles (from the mockup).
function Journey() {
  const stops = [
    { icon: CalendarDays, title: 'Log', text: 'Your daily symptoms, food, sleep and more.', bg: 'var(--primary-soft)', c: 'var(--primary)', x: 62, y: 78, w: 148 },
    { icon: BarChart3, title: 'Notice', text: 'See patterns in your unique data.', bg: 'var(--mild-soft)', c: 'var(--mild)', x: 182, y: 196, w: 104 },
    { icon: UserRound, title: 'Share', text: 'Go to your GP with a clear, easy-to-read summary.', bg: 'var(--primary-soft)', c: 'var(--primary)', x: 62, y: 304, w: 170 },
  ]
  const W = 340, H = 380, R = 34
  const pct = (v, t) => `${(v / t) * 100}%`
  const dots = [[108, 30], [282, 150], [158, 232], [30, 106], [50, 350]]
  return (
    <div className="relative mx-auto mt-6 w-full max-w-[380px]" style={{ aspectRatio: `${W} / ${H}` }} aria-label="How IBSync works">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <circle cx="212" cy="240" r="118" fill="var(--surface-2)" opacity=".75" />
        <circle cx="128" cy="150" r="86" fill="var(--surface-2)" opacity=".5" />
        <g fill="none" stroke="var(--primary)" strokeOpacity=".45" strokeWidth="1.6" strokeLinecap="round">
          <path d="M108 30 C 205 8, 290 60, 282 150" />
          <path d="M158 232 C 140 258, 112 266, 92 276" />
          <path d="M30 106 C 2 170, 2 240, 30 284" />
          <path d="M50 350 C 110 376, 232 370, 284 326" />
        </g>
        {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="var(--surface)" stroke="var(--primary)" strokeOpacity=".55" strokeWidth="1.6" />)}
      </svg>
      {stops.map(s => (
        <div key={s.title} className="absolute flex items-start gap-3" style={{ left: pct(s.x - R, W), top: pct(s.y - R, H), width: pct(R * 2 + 12 + s.w, W) }}>
          <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 68, height: 68, background: s.bg }}>
            <s.icon size={30} color={s.c} strokeWidth={2} />
          </span>
          <span className="min-w-0 pt-2">
            <span className="font-display block text-[1.2rem] font-bold leading-tight">{s.title}</span>
            <span className="mt-0.5 block text-sm leading-snug text-ink-2">{s.text}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
