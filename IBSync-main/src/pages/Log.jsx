import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Check, Minus, Plus, Droplet } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Segmented, Chip, Btn, H2 } from '../components/ui.jsx'
import { BristolIcon, BRISTOL, PainFace, PAIN_WORDS } from '../components/art.jsx'
import { FOODS } from '../data/foods.js'

const WHEN = [
  { label: 'Now', min: 0 },
  { label: '30 min ago', min: 30 },
  { label: '1 h ago', min: 60 },
  { label: '3 h ago', min: 180 },
]

function When({ value, onChange }) {
  return (
    <div className="scroll-x flex gap-2">
      {WHEN.map(w => <Chip key={w.min} on={value === w.min} onClick={() => onChange(w.min)}>{w.label}</Chip>)}
    </div>
  )
}

export default function Log() {
  const { t } = useStore()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'meal'
  return (
    <div>
      <PageHeader title={t('log')} sub="Takes under 10 seconds. Every entry sharpens your insights." />
      <div className="px-5">
        <Segmented value={tab} onChange={v => setSp({ tab: v }, { replace: true })} options={[
          { value: 'meal', label: t('meal') }, { value: 'feel', label: t('feel') }, { value: 'stool', label: t('stool') },
          { value: 'body', label: t('body') }, { value: 'diary', label: t('diary') },
        ]} />
      </div>
      <div className="px-5 pt-6">
        {tab === 'meal' && <MealForm />}
        {tab === 'feel' && <FeelForm />}
        {tab === 'stool' && <StoolForm />}
        {tab === 'body' && <BodyForm />}
        {tab === 'diary' && <DiaryForm />}
      </div>
    </div>
  )
}

function useSave() {
  const { dispatch, t } = useStore()
  const nav = useNavigate()
  const [done, setDone] = useState(false)
  const save = (event, mins = 0) => {
    dispatch({ type: 'add', event: { ...event, ts: new Date(Date.now() - mins * 60000).toISOString() } })
    setDone(true)
    setTimeout(() => nav('/'), 900)
  }
  const Saved = () => done ? <div role="status" className="rise fixed inset-x-0 bottom-28 z-40 mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-bg"><Check size={16} /> {t('saved')}</div> : null
  return { save, Saved }
}

const VERDICT_STYLE = {
  avoid: { bg: 'var(--flare-soft)', label: 'Trigger for you' },
  caution: { bg: 'var(--mild-soft)', label: 'Go easy' },
  safe: { bg: 'var(--calm-soft)', label: 'Usually fine' },
}

function MealForm() {
  const { ctx, t } = useStore()
  const { save, Saved } = useSave()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState([])
  const [mins, setMins] = useState(0)
  const verdict = useMemo(() => Object.fromEntries(ctx.foods.map(f => [f.id, f.verdict])), [ctx.foods])
  const list = FOODS.filter(f => f.name.toLowerCase().includes(q.toLowerCase()))
  const groups = [...new Set(list.map(f => f.group))]
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const h = new Date(Date.now() - mins * 60000).getHours()
  const slot = h < 5 ? 'Snack' : h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner'
  const warn = sel.filter(id => verdict[id] === 'avoid')

  return (
    <div className="space-y-6">
      <div>
        <H2>{t('whatAte')}</H2>
        <label className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4">
          <Search size={18} className="text-ink-3" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search kopi, laksa, oats…" className="h-12 w-full bg-transparent outline-none placeholder:text-ink-3" />
        </label>
      </div>
      {groups.map(g => (
        <div key={g}>
          <p className="mb-2 text-sm font-bold text-ink-2">{g}</p>
          <div className="flex flex-wrap gap-2">
            {list.filter(f => f.group === g).map(f => {
              const v = VERDICT_STYLE[verdict[f.id]]
              const on = sel.includes(f.id)
              return (
                <button key={f.id} onClick={() => toggle(f.id)} aria-pressed={on}
                  className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 text-left text-sm font-semibold transition ${on ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:border-ink-3'}`}>
                  <span aria-hidden>{f.emoji}</span>
                  <span>{f.name}</span>
                  {v && !on && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-ink" style={{ background: v.bg }}>{v.label}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div>
        <p className="mb-2 text-sm font-bold text-ink-2">When</p>
        <When value={mins} onChange={setMins} />
      </div>
      {warn.length > 0 && (
        <p className="rounded-2xl bg-mild-soft p-3.5 text-sm">
          Heads up: {warn.map(w => FOODS.find(f => f.id === w).name).join(', ')} has come before symptoms for you. No judgement — logging it helps confirm the pattern. We'll check in with you in about 2 hours.
        </p>
      )}
      <div className="sticky bottom-[88px] -mx-5 bg-gradient-to-t from-bg via-bg to-transparent px-5 pt-6 pb-3">
        <Btn className="w-full" disabled={!sel.length} onClick={() => save({ kind: 'meal', foods: sel, slot }, mins)}>
          Save {slot.toLowerCase()}{sel.length ? ` · ${sel.length} item${sel.length > 1 ? 's' : ''}` : ''}
        </Btn>
      </div>
      <Saved />
    </div>
  )
}

const SYMPTOMS = ['bloating', 'cramping', 'gas', 'urgency', 'nausea', 'reflux', 'fatigue', 'fever', 'vomiting']
const CONTEXT = ['Stress', 'Poor sleep', 'Eating out', 'Rushed meal', 'Period', 'Travel', 'Skipped meds']

function FeelForm() {
  const { t } = useStore()
  const { save, Saved } = useSave()
  const [pain, setPain] = useState(3)
  const [types, setTypes] = useState([])
  const [context, setContext] = useState([])
  const [mins, setMins] = useState(0)
  const tog = (arr, set, v) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  const alarm = types.includes('fever') || types.includes('vomiting') || pain >= 9
  return (
    <div className="space-y-7">
      <div>
        <H2>{t('painLevel')}</H2>
        <div className="flex items-center gap-4 rounded-[22px] border border-line bg-surface p-4">
          <PainFace level={pain} size={64} />
          <div>
            <p className="num text-3xl font-black">{pain}<span className="text-lg text-ink-3">/10</span></p>
            <p className="font-bold text-ink-2">{PAIN_WORDS[pain]}</p>
          </div>
        </div>
        <input aria-label="Pain level 0 to 10" type="range" min={0} max={10} value={pain} onChange={e => setPain(+e.target.value)} className="ibs-range mt-3" />
        <div className="flex justify-between text-xs font-bold text-ink-3"><span>No pain</span><span>Worst imaginable</span></div>
      </div>
      <div>
        <H2>{t('whatFeel')}</H2>
        <div className="flex flex-wrap gap-2">{SYMPTOMS.map(s => <Chip key={s} on={types.includes(s)} onClick={() => tog(types, setTypes, s)} className="capitalize">{s}</Chip>)}</div>
      </div>
      <div>
        <H2>Anything going on?</H2>
        <div className="flex flex-wrap gap-2">{CONTEXT.map(s => <Chip key={s} on={context.includes(s)} onClick={() => tog(context, setContext, s)}>{s}</Chip>)}</div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-ink-2">When did it start?</p>
        <When value={mins} onChange={setMins} />
      </div>
      {alarm && (
        <p className="rounded-2xl border border-flare/40 bg-flare-soft p-3.5 text-sm">
          <strong>Fever, vomiting or very severe pain aren't typical IBS.</strong> Please see a doctor today. If pain is sudden and severe, call 995 or go to A&E.
        </p>
      )}
      <Btn className="w-full" onClick={() => save({ kind: 'symptom', pain, types, context }, mins)}>Save check-in</Btn>
      <Saved />
    </div>
  )
}

function StoolForm() {
  const { t } = useStore()
  const { save, Saved } = useSave()
  const [type, setType] = useState(null)
  const [urgency, setUrgency] = useState(false)
  const [straining, setStraining] = useState(false)
  const [blood, setBlood] = useState(false)
  return (
    <div className="space-y-6">
      <div>
        <H2>{t('whichType')}</H2>
        <div className="grid grid-cols-2 gap-2.5">
          {BRISTOL.map(b => (
            <button key={b.type} onClick={() => setType(b.type)} aria-pressed={type === b.type}
              className={`flex items-center gap-3 rounded-[20px] border-2 p-3 text-left transition ${type === b.type ? 'border-ink bg-surface' : 'border-transparent bg-surface-2 hover:border-line'} ${b.type === 7 ? 'col-span-2' : ''}`}>
              <BristolIcon type={b.type} size={48} color={b.zone === 'ok' ? 'var(--calm)' : b.zone === 'hard' ? 'var(--accent)' : 'var(--mild)'} />
              <span>
                <span className="block text-xs font-bold text-ink-3">Type {b.type}</span>
                <span className="block text-sm font-bold leading-tight">{b.name}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-3">Types 3–5 are the comfortable middle. 1–2 lean constipated, 6–7 lean loose.</p>
      </div>
      <div className="space-y-2">
        <Toggle on={urgency} set={setUrgency} label="Had to rush" />
        <Toggle on={straining} set={setStraining} label="Straining or felt incomplete" />
        <Toggle on={blood} set={setBlood} label="Noticed blood" />
      </div>
      {blood && <p className="rounded-2xl border border-flare/40 bg-flare-soft p-3.5 text-sm"><strong>Blood isn't a usual IBS symptom.</strong> It's often something minor, but please get it checked by a doctor. We'll add it to your doctor summary.</p>}
      <Btn className="w-full" disabled={!type} onClick={() => save({ kind: 'stool', bristol: type, urgency, straining, blood })}>Save</Btn>
      <Saved />
    </div>
  )
}

function Toggle({ on, set, label }) {
  return (
    <button onClick={() => set(!on)} role="switch" aria-checked={on} className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 font-semibold">
      {label}
      <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-primary' : 'bg-surface-2'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}

const STRESS = ['Relaxed', 'Okay', 'Busy', 'Stressed', 'Overwhelmed']

function BodyForm() {
  const { ctx, dispatch, state, t } = useStore()
  const [stress, setStress] = useState(ctx.today.stress || null)
  const [sleep, setSleep] = useState(ctx.today.sleep || 7)
  const [ex, setEx] = useState(null)
  const [exType, setExType] = useState('Walk')
  const [msg, setMsg] = useState(null)
  const flash = m => { setMsg(m); setTimeout(() => setMsg(null), 1600) }
  const add = (event, m) => { dispatch({ type: 'add', event }); flash(m) }
  return (
    <div className="space-y-8">
      <div>
        <H2>{t('water')}</H2>
        <div className="flex items-center gap-4 rounded-[22px] bg-primary-soft p-4">
          <Droplet className="text-primary" size={30} />
          <div className="flex-1">
            <p className="num text-2xl font-black">{(ctx.today.water / 1000).toFixed(2)} L</p>
            <p className="text-sm text-ink-2">Goal {state.profile.waterGoal / 1000} L</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" className="bg-surface" onClick={() => add({ kind: 'water', ml: 250 }, '+250 ml')}>+250</Btn>
            <Btn onClick={() => add({ kind: 'water', ml: 500 }, '+500 ml')}>+500</Btn>
          </div>
        </div>
      </div>
      <div>
        <H2>{t('exercise')}</H2>
        <div className="mb-2 flex flex-wrap gap-2">{['Walk', 'Gym', 'Yoga', 'Sport', 'Cycle'].map(x => <Chip key={x} on={exType === x} onClick={() => setExType(x)}>{x}</Chip>)}</div>
        <div className="flex flex-wrap gap-2">{[10, 20, 30, 45, 60].map(m => <Chip key={m} on={ex === m} onClick={() => setEx(m)}>{m} min</Chip>)}</div>
        <Btn variant="soft" className="mt-3 w-full" disabled={!ex} onClick={() => { add({ kind: 'exercise', minutes: ex, type: exType }, `${ex} min ${exType.toLowerCase()} saved`); setEx(null) }}>Save movement</Btn>
      </div>
      <div>
        <H2>{t('howStressed')}</H2>
        <div className="grid grid-cols-5 gap-1.5">
          {STRESS.map((s, i) => (
            <button key={s} onClick={() => { setStress(i + 1); add({ kind: 'stress', level: i + 1 }, 'Stress saved') }} aria-pressed={stress === i + 1}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-[11px] font-bold ${stress === i + 1 ? 'border-ink bg-surface' : 'border-transparent bg-surface-2'}`}>
              <PainFace level={[0, 2, 4, 6, 8][i]} size={30} />
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <H2>{t('howSlept')}</H2>
        <div className="flex items-center justify-between rounded-[22px] border border-line bg-surface p-3">
          <button aria-label="Less sleep" onClick={() => setSleep(s => Math.max(0, s - .5))} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2"><Minus size={18} /></button>
          <p className="num text-2xl font-black">{sleep} h</p>
          <button aria-label="More sleep" onClick={() => setSleep(s => Math.min(14, s + .5))} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2"><Plus size={18} /></button>
        </div>
        <Btn variant="soft" className="mt-3 w-full" onClick={() => add({ kind: 'sleep', hours: sleep, quality: sleep >= 7 ? 4 : 3 }, 'Sleep saved')}>Save sleep</Btn>
      </div>
      {msg && <div role="status" className="rise fixed inset-x-0 bottom-28 z-40 mx-auto flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-bg"><Check size={16} /> {msg}</div>}
    </div>
  )
}

const MOODS = ['Awful', 'Low', 'Okay', 'Good', 'Great']
const PROMPTS = ['What went well today?', 'Did anything make your tummy worse?', 'How did you feel about eating out?', 'What helped you relax?']

function DiaryForm() {
  const { t } = useStore()
  const { save, Saved } = useSave()
  const [mood, setMood] = useState(3)
  const [text, setText] = useState('')
  return (
    <div className="space-y-6">
      <div>
        <H2>{t('howDay')}</H2>
        <div className="grid grid-cols-5 gap-1.5">
          {MOODS.map((m, i) => (
            <button key={m} onClick={() => setMood(i + 1)} aria-pressed={mood === i + 1}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2.5 text-xs font-bold ${mood === i + 1 ? 'border-ink bg-surface' : 'border-transparent bg-surface-2'}`}>
              <PainFace level={[9, 6, 3, 1, 0][i]} size={30} />{m}
            </button>
          ))}
        </div>
      </div>
      <div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder={t('writeHere')}
          className="w-full rounded-[22px] border border-line bg-surface p-4 leading-relaxed outline-none placeholder:text-ink-3 focus:border-ink-3" />
        <div className="scroll-x mt-2 flex gap-2">
          {PROMPTS.map(p => <Chip key={p} onClick={() => setText(x => (x ? x + '\n' : '') + p + ' ')}>{p}</Chip>)}
        </div>
        <p className="mt-3 text-xs text-ink-3">Your diary is stored on this device. IBSync picks out themes (like stress or eating out) to connect them with your symptoms; only those themes and your latest line are shared with the AI.</p>
      </div>
      <Btn className="w-full" disabled={!text.trim()} onClick={() => save({ kind: 'diary', text: text.trim(), mood })}>Save entry</Btn>
      <Saved />
    </div>
  )
}
