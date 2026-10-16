import { useEffect, useState } from 'react'
import { X, Flame, Leaf, FileDown, Check } from 'lucide-react'
import { useStore } from '../store.jsx'
const exportReport = args => import('../lib/report.js').then(m => m.exportReport(args))

const PHASES = [['inhale', 4], ['hold', 2], ['exhale', 6]]
const COMFORT = [
  'Warm heat pack or hot-water bottle on your tummy',
  'Loosen your waistband and lie on your left side',
  'Small sips of peppermint or ginger tea',
  'A slow, gentle walk if you can manage it',
]
const GENTLE = ['Plain congee', 'Rice + steamed fish', 'Firm banana', 'Rice crackers', 'Clear soup', 'Oats with water']

export default function FlareMode({ onClose }) {
  const { state, ctx, dispatch, t } = useStore()
  const [phase, setPhase] = useState(0)
  const [logged, setLogged] = useState(null)
  const [cycles, setCycles] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => {
      setPhase(p => (p + 1) % 3)
      if (phase === 2) setCycles(c => c + 1)
    }, PHASES[phase][1] * 1000)
    return () => clearTimeout(id)
  }, [phase])

  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [onClose])

  const logFlare = pain => { dispatch({ type: 'add', event: { kind: 'symptom', pain, types: ['cramping'], context: ['Flare mode'] } }); setLogged(pain) }
  const prn = state.profile.meds.filter(m => m.prn)
  const scale = phase === 0 ? 1 : phase === 1 ? 1 : .62
  const dur = PHASES[phase][1]

  return (
    <div data-theme="espresso" className="flare-mode fixed inset-0 z-50 overflow-y-auto bg-bg text-ink" role="dialog" aria-modal="true" aria-label={t('flareMode')}>
      <div className="mx-auto max-w-[460px] px-5 pb-16 pt-5">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-2 font-extrabold text-ink-2"><Flame size={18} className="text-flare" />{t('flareMode')}</p>
          <button onClick={onClose} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-sm font-bold"><X size={16} />{t('exitFlare')}</button>
        </div>

        <h1 className="mt-8 text-[1.6rem] font-black leading-tight">This will pass. Let's slow things down together.</h1>

        <div className="mt-10 flex flex-col items-center">
          <div className="relative flex h-60 w-60 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/10" />
            <div className="absolute inset-3 rounded-full bg-primary/25 transition-transform ease-in-out"
              style={{ transform: `scale(${scale})`, transitionDuration: `${phase === 1 ? 0 : dur}s` }} />
            <div className="relative text-center">
              <p className="text-2xl font-black">{t(PHASES[phase][0])}</p>
              <p className="num mt-1 text-sm text-ink-2">{dur} seconds</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-2">{t('breathe')} · {cycles} breath{cycles === 1 ? '' : 's'}</p>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 font-extrabold">Comfort, right now</h2>
          <ul className="space-y-2">{COMFORT.map(c => <li key={c} className="rounded-2xl bg-surface px-4 py-3">{c}</li>)}</ul>
        </section>

        {prn.length > 0 && (
          <section className="mt-6 rounded-2xl bg-surface-2 p-4">
            <p className="font-bold">Your as-needed medicine</p>
            {prn.map(m => <p key={m.id} className="text-sm text-ink-2">{m.label} — {m.note}. Follow the dose on your label.</p>)}
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-3 inline-flex items-center gap-2 font-extrabold"><Leaf size={17} className="text-primary" />Gentle foods for today</h2>
          <div className="flex flex-wrap gap-2">{GENTLE.map(g => <span key={g} className="rounded-full bg-surface px-3 py-2 text-sm font-semibold">{g}</span>)}</div>
          {ctx.triggers.length > 0 && <p className="mt-3 text-sm text-ink-2">Best skipped today: {ctx.triggers.slice(0, 3).map(f => f.food.name).join(', ')}.</p>}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 font-extrabold">Log this flare</h2>
          {logged ? (
            <p className="inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 font-bold"><Check size={18} className="text-primary" />Logged at pain {logged}/10. Rest now — you can add details later.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {[5, 6, 7, 8].map(p => <button key={p} onClick={() => logFlare(p)} className="rounded-2xl bg-surface py-3 text-lg font-black">{p}<span className="text-xs text-ink-3">/10</span></button>)}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-flare/40 p-4">
          <p className="font-extrabold">{t('whenUrgent')}</p>
          <p className="mt-1 text-sm text-ink-2">Blood in your stool, fever, repeated vomiting, fainting, or pain that's severe and different from your usual flares. Call <strong className="text-ink">995</strong> for emergencies.</p>
        </section>

        <button onClick={() => exportReport({ state, ctx, questions: [] })} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3.5 font-bold">
          <FileDown size={18} />{t('exportReport')}
        </button>
      </div>
    </div>
  )
}
