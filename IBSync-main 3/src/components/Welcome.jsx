import { useState } from 'react'
import { Stethoscope, Search } from 'lucide-react'
import { useStore } from '../store.jsx'
import { Logo, Pebble } from './art.jsx'
import { Btn } from './ui.jsx'
import { LANGS } from '../i18n.js'

// First-run screen: who is this for? Sets diagnosed vs suspected mode.
export default function Welcome() {
  const { state, dispatch } = useStore()
  const [name, setName] = useState(state.profile.name)
  const [status, setStatus] = useState(null)

  const OPTIONS = [
    { id: 'diagnosed', icon: Stethoscope, title: "I've been diagnosed with IBS", sub: 'Find my triggers, keep my medicines on track and have better check-ups.' },
    { id: 'suspected', icon: Search, title: 'I think I might have IBS', sub: 'Build a clear symptom diary to show a doctor and get answers.' },
  ]

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="mx-auto flex min-h-full max-w-[460px] flex-col px-6 pb-10 pt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Logo size={32} /><span className="text-xl font-black">IBSync</span></div>
          <select aria-label="Language" value={state.settings.lang} onChange={e => dispatch({ type: 'settings', patch: { lang: e.target.value } })}
            className="h-10 rounded-full border border-line bg-surface px-3 text-sm font-bold">
            {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        <div className="mt-10 flex gap-1.5" aria-hidden>
          {['calm', 'calm', 'mild', 'calm', 'flare', 'mild', 'calm'].map((s, i) => <Pebble key={i} status={s} i={i} size={36} />)}
        </div>
        <h1 id="welcome-title" className="mt-6 text-[2rem] font-black leading-[1.1] tracking-[-0.02em]">Let's get to know your gut.</h1>
        <p className="mt-3 text-ink-2">A few taps a day turn into patterns you — and your doctor — can actually use.</p>

        <label className="mt-8 block">
          <span className="text-sm font-bold text-ink-2">What should we call you?</span>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-surface px-4 text-lg font-bold outline-none focus:border-ink-3" />
        </label>

        <p className="mt-7 text-sm font-bold text-ink-2">Which sounds most like you?</p>
        <div className="mt-2 space-y-2.5">
          {OPTIONS.map(o => (
            <button key={o.id} onClick={() => setStatus(o.id)} aria-pressed={status === o.id}
              className={`flex w-full items-start gap-4 rounded-[22px] border-2 p-4 text-left transition ${status === o.id ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:border-ink-3'}`}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status === o.id ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink-2'}`}><o.icon size={22} /></span>
              <span><span className="block text-[1.05rem] font-extrabold leading-snug">{o.title}</span><span className="mt-0.5 block text-sm text-ink-2">{o.sub}</span></span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <Btn className="w-full" disabled={!status} onClick={() => dispatch({ type: 'onboard', status, name: name.trim() })}>Start</Btn>
          <p className="mt-3 text-center text-xs text-ink-3">We've added 4 weeks of sample logs so you can explore. Clear them anytime in Settings. IBSync doesn't diagnose — it helps you and your doctor see the full picture.</p>
        </div>
      </div>
    </div>
  )
}
