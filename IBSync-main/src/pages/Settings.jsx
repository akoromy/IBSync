import { useEffect, useState } from 'react'
import { Check, Sparkles, Cpu } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { H2, Segmented, Btn } from '../components/ui.jsx'
import { LANGS } from '../i18n.js'
import { aiHealth } from '../ai/client.js'

export const THEMES = [
  { id: 'oat', name: 'Oat & Moss', note: 'Warm cream, moss green, terracotta', sw: ['#F8F6F0', '#4E8273', '#B96E4A', '#C9962F'] },
  { id: 'sage', name: 'Sage Clinic', note: 'Cool sage, deeper teal — calm and clinical-friendly', sw: ['#EBF1EE', '#2F6B5E', '#C27650', '#BF8E2A'] },
  { id: 'clay', name: 'Clay', note: 'Terracotta-led, earthy and warm', sw: ['#F7F0E8', '#A55F3C', '#4E7F71', '#C2902C'] },
  { id: 'espresso', name: 'Espresso', note: 'Dark mode — deep espresso, easy on the eyes at night', sw: ['#1C1917', '#8EC0AF', '#DDA07C', '#E2B862'] },
]

export default function Settings() {
  const { state, dispatch, t } = useStore()
  const set = patch => dispatch({ type: 'settings', patch })
  const s = state.settings
  const [ai, setAi] = useState(null)
  useEffect(() => { aiHealth().then(setAi) }, [])

  return (
    <div>
      <PageHeader back title={t('settings')} />
      <div className="space-y-8 px-5">
        <section>
          <H2>{t('theme')}</H2>
          <div className="grid grid-cols-2 gap-2.5">
            {THEMES.map(th => (
              <button key={th.id} onClick={() => set({ theme: th.id })} aria-pressed={s.theme === th.id}
                className={`rounded-[20px] border-2 p-3 text-left transition ${s.theme === th.id ? 'border-ink' : 'border-line'}`} style={{ background: th.sw[0] }}>
                <div className="flex gap-1.5">{th.sw.slice(1).map(c => <span key={c} className="h-7 w-7 rounded-full" style={{ background: c }} />)}</div>
                <p className="mt-3 font-extrabold" style={{ color: th.id === 'espresso' ? '#F2EBE3' : '#2A2621' }}>{th.name}</p>
                <p className="text-xs" style={{ color: th.id === 'espresso' ? '#B8AC9F' : '#6B6358' }}>{th.note}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <H2>{t('language')}</H2>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map(l => (
              <button key={l.id} onClick={() => set({ lang: l.id })} aria-pressed={s.lang === l.id}
                className={`flex min-h-[48px] items-center justify-between rounded-2xl border px-4 font-bold ${s.lang === l.id ? 'border-ink bg-surface' : 'border-line'}`}>
                {l.label}{s.lang === l.id && <Check size={18} />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-3">Menus switch instantly. AI insights and chat reply in this language when the AI service is connected.</p>
        </section>

        <section>
          <H2>{t('textSize')}</H2>
          <Segmented value={s.size} onChange={v => set({ size: v })} options={[{ value: 'md', label: 'Standard' }, { value: 'lg', label: 'Large' }, { value: 'xl', label: 'Extra large' }]} />
        </section>

        <section className="space-y-2">
          <H2>Reading & motion</H2>
          <Row label="Simpler wording" sub="Shorter sentences and everyday words in AI replies" on={s.simple} onClick={() => set({ simple: !s.simple })} />
          <Row label="Reduce motion" sub="Turn off animations" on={s.motion === 'reduce'} onClick={() => set({ motion: s.motion === 'reduce' ? 'auto' : 'reduce' })} />
        </section>

        <section>
          <H2>Profile</H2>
          <label className="block">
            <span className="text-sm font-bold text-ink-2">Name shown in the app</span>
            <input value={state.profile.name} onChange={e => dispatch({ type: 'profile', patch: { name: e.target.value } })} className="mt-1 h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none" />
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-bold text-ink-2">Age</span>
            <input type="number" min={12} max={99} value={state.profile.age} onChange={e => dispatch({ type: 'profile', patch: { age: +e.target.value } })} className="mt-1 h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none" />
          </label>
        </section>

        <section>
          <H2>AI service</H2>
          <div className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
            {ai?.configured ? <Sparkles className="shrink-0 text-primary" /> : <Cpu className="shrink-0 text-ink-2" />}
            <div className="text-sm">
              <p className="font-bold">{ai?.configured ? `Connected · ${ai.model}` : 'On-device insights'}</p>
              <p className="text-ink-2">{ai?.configured ? 'Only a de-identified summary of your numbers is sent. Your name and full diary never leave the device.' : 'No AI key set, so insights are computed on this device from your logs. Everything still works.'}</p>
            </div>
          </div>
        </section>

        <section className="pb-6">
          <H2>Data</H2>
          <p className="mb-3 text-sm text-ink-2">Your logs are stored on this device only. This demo starts with 4 weeks of sample data.</p>
          <Btn variant="ghost" className="w-full" onClick={() => { if (confirm('Reset to the sample data? Your entries will be removed.')) { sessionStorage.clear(); dispatch({ type: 'reset' }) } }}>Reset demo data</Btn>
        </section>
      </div>
    </div>
  )
}

function Row({ label, sub, on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left">
      <span><span className="block font-bold">{label}</span><span className="block text-sm text-ink-2">{sub}</span></span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-primary' : 'bg-surface-2'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}
