import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, PackageOpen, Search, MessageCircleQuestion, Plus } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Card, H2, Chip, Btn } from '../components/ui.jsx'
import { medById, findMed } from '../data/meds.js'
import { todaysDoses } from '../lib/doses.js'

const BARRIER_TIPS = {
  'Eating out — forgot to bring it': 'Keep a spare strip in your bag or phone case, and set a reminder 15 min before your usual dinner.',
  'Forgot': 'Link the dose to something you already do — like putting it next to your toothbrush or kettle.',
  'Felt fine, skipped': 'Antispasmodics work best taken regularly, not only on bad days. Worth asking your doctor whether "as needed" suits you.',
  'Ran out at work': 'Your refill reminder can fire a week early. Consider keeping a small supply at work.',
  'Side effects': 'Note what you felt and when. Don\'t stop on your own — your pharmacist can suggest options.',
  'Cost': 'Ask your polyclinic about subsidised or generic options — CHAS and MediSave may help.',
}
const REASONS = ['Forgot', 'Eating out — forgot to bring it', 'Felt fine, skipped', 'Ran out at work', 'Side effects', 'Cost']

function Ring({ pct, size = 64 }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r
  const color = pct >= 85 ? 'var(--calm)' : pct >= 65 ? 'var(--mild)' : 'var(--flare)'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${pct}% taken`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth="7" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="7" fill="none" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" className="num" style={{ fontSize: 15, fontWeight: 900, fill: 'var(--ink)' }}>{pct}%</text>
    </svg>
  )
}

export default function Meds() {
  const { state, ctx, dispatch, t } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(null)
  const [missFor, setMissFor] = useState(null)
  const [q, setQ] = useState('')
  const doses = todaysDoses(state.events, state.profile)
  const found = q.length > 2 ? findMed(q) : null

  const logMiss = (d, reason) => {
    dispatch({ type: 'add', event: { kind: 'med', medId: d.med.id, scheduled: d.at.toISOString(), status: 'missed', reason } })
    setMissFor(null)
  }

  return (
    <div>
      <PageHeader title={t('meds')} sub="Understand each medicine and keep your routine on track." />

      <section className="px-5">
        <H2>{t('today')}</H2>
        <div className="space-y-2">
          {doses.map(d => (
            <div key={d.key} className="rounded-2xl border border-line bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="num w-12 text-sm font-extrabold text-ink-2">{d.time}</span>
                <p className="min-w-0 flex-1 truncate font-bold">{d.med.label}</p>
                {d.status === 'taken' && <span className="inline-flex items-center gap-1 rounded-full bg-calm-soft px-3 py-1.5 text-xs font-bold"><Check size={14} />{t('taken')}</span>}
                {d.status === 'missed' && <span className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold text-ink-2">{t('missed')}</span>}
                {(d.status === 'due' || d.status === 'upcoming') && (
                  <div className="flex gap-1.5">
                    <button onClick={() => setMissFor(missFor === d.key ? null : d.key)} className="rounded-full bg-surface-2 px-3 py-2 text-xs font-bold">Couldn't</button>
                    <button onClick={() => dispatch({ type: 'add', event: { kind: 'med', medId: d.med.id, scheduled: d.at.toISOString(), status: 'taken' } })} className="rounded-full bg-primary px-3 py-2 text-xs font-extrabold text-primary-ink">{t('taken')}</button>
                  </div>
                )}
              </div>
              {missFor === d.key && (
                <div className="rise mt-3 border-t border-line pt-3">
                  <p className="mb-2 text-sm font-bold">What got in the way? No judgement — this helps find a routine that works.</p>
                  <div className="flex flex-wrap gap-1.5">{REASONS.map(r => <Chip key={r} onClick={() => logMiss(d, r)}>{r}</Chip>)}</div>
                </div>
              )}
            </div>
          ))}
          {state.profile.meds.filter(m => m.prn).map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3">
              <span className="w-12 text-xs font-bold text-ink-3">as needed</span>
              <p className="min-w-0 flex-1 truncate font-bold">{m.label}</p>
              <button onClick={() => dispatch({ type: 'add', event: { kind: 'med', medId: m.id, status: 'taken', prn: true } })} className="rounded-full bg-surface-2 px-3 py-2 text-xs font-bold">Log a dose</button>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-8">
        <H2>Last 2 weeks</H2>
        <div className="space-y-3">
          {ctx.adherence.map(a => {
            const top = a.reasons[0]
            return (
              <Card key={a.med.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Ring pct={a.pct ?? 0} />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{a.med.label}</p>
                    <p className="text-sm text-ink-2">{a.taken} of {a.due} doses taken</p>
                    <div className="mt-2 flex gap-1.5">
                      {a.bySlot.map(s => (
                        <span key={s.time} className="num rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: s.pct >= 85 ? 'var(--calm-soft)' : s.pct >= 65 ? 'var(--mild-soft)' : 'var(--flare-soft)' }}>{s.time} · {s.pct}%</span>
                      ))}
                    </div>
                  </div>
                </div>
                {top && (
                  <div className="mt-4 rounded-2xl bg-surface-2 p-3.5">
                    <p className="text-sm"><span className="font-bold">Most common barrier:</span> “{top[0]}” ({top[1]}×)</p>
                    <p className="mt-1 text-sm text-ink-2">{BARRIER_TIPS[top[0]]}</p>
                  </div>
                )}
                {a.daysLeft != null && a.daysLeft <= 10 && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><PackageOpen size={16} className="text-accent" /> About {a.daysLeft} days left — time to arrange a refill.</p>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <section className="px-5 pt-8">
        <H2>Understand your medicines</H2>
        <div className="space-y-2">
          {state.profile.meds.map(m => {
            const kb = medById[m.id]
            const isOpen = open === m.id
            return (
              <div key={m.id} className="overflow-hidden rounded-[20px] border border-line bg-surface">
                <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{kb.name}</p>
                    <p className="text-sm text-ink-2">{kb.kind}</p>
                  </div>
                  <ChevronDown className={`text-ink-3 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <MedFacts kb={kb} onAsk={() => nav('/ask', { state: { q: `Tell me more about ${kb.name}` } })} />}
              </div>
            )
          })}
        </div>
      </section>

      <section className="px-5 pt-8">
        <H2>Look up a medicine</H2>
        <label className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4">
          <Search size={18} className="text-ink-3" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Type the name on the box, e.g. Buscopan" className="h-12 w-full bg-transparent outline-none placeholder:text-ink-3" />
        </label>
        {q.length > 2 && (found ? (
          <div className="mt-3 overflow-hidden rounded-[20px] border border-line bg-surface">
            <div className="px-4 pt-3.5"><p className="font-extrabold">{found.name}</p><p className="text-sm text-ink-2">{found.kind}</p></div>
            <MedFacts kb={found} />
            {!state.profile.meds.some(m => m.id === found.id) && (
              <div className="px-4 pb-4">
                <Btn variant="soft" className="w-full" onClick={() => { dispatch({ type: 'profile', patch: { meds: [...state.profile.meds, { id: found.id, label: found.name, times: [], note: 'Add your times from the label', supply: 0, prn: true }] } }); setQ('') }}>
                  <Plus size={18} /> Add to my medicines
                </Btn>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-surface-2 p-4 text-sm">
            <strong>I'm not able to identify that medication.</strong> Please check with your pharmacist — show them the box or label. If you have the exact name, try typing it again.
          </p>
        ))}
      </section>
    </div>
  )
}

function MedFacts({ kb, onAsk }) {
  const rows = [
    ['What it\'s for', kb.forWhat],
    ['How it\'s usually taken', kb.howToTake],
    ['Common side effects', kb.sideEffects],
    ['Helpful tip', kb.tips],
    ['Talk to your doctor or pharmacist if', kb.askIf],
  ]
  return (
    <div className="rise space-y-3 px-4 pb-4 pt-1">
      {rows.map(([k, v]) => (
        <div key={k}><p className="text-xs font-bold text-ink-3">{k}</p><p className="text-[0.95rem] leading-snug">{v}</p></div>
      ))}
      <p className="text-xs text-ink-3">General information. Your prescription label and pharmacist come first.</p>
      {onAsk && <button onClick={onAsk} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><MessageCircleQuestion size={16} /> Ask a question about it</button>}
    </div>
  )
}
