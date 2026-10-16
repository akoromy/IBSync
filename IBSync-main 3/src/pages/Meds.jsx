import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, PackageOpen, MessageCircleQuestion, Plus, Pencil, Trash2, X, Pill, Info } from 'lucide-react'
import { useStore, uid } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Card, H2, Chip, Btn } from '../components/ui.jsx'
import { medById, findMed } from '../data/meds.js'
import { todaysDoses } from '../lib/doses.js'

const BARRIER_TIPS = {
  'Eating out — forgot to bring it': 'Keep a spare strip in your bag or phone case, and set a reminder 15 min before your usual dinner.',
  'Forgot': 'Link the dose to something you already do — like putting it next to your toothbrush or kettle.',
  'Felt fine, skipped': 'Some IBS medicines work best taken regularly, not only on bad days. Worth asking your doctor whether "as needed" suits you.',
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
  const [editing, setEditing] = useState(null) // med object or 'new'
  const doses = todaysDoses(state.events, state.profile)
  const meds = state.profile.meds

  const logMiss = (d, reason) => {
    dispatch({ type: 'add', event: { kind: 'med', medId: d.med.id, scheduled: d.at.toISOString(), status: 'missed', reason } })
    setMissFor(null)
  }

  return (
    <div>
      <PageHeader title={t('meds')} sub="Understand each medicine and keep your routine on track." />

      {meds.length === 0 && !editing && (
        <section className="px-5">
          <div className="rounded-[22px] bg-surface-2 p-5">
            <Pill className="text-primary" />
            <p className="mt-3 text-lg font-extrabold leading-snug">No medicines added yet.</p>
            <p className="mt-1 text-ink-2">Add anything you take for your gut, including over-the-counter remedies, fibre or probiotics. Your doctor will want to know.</p>
            <Btn className="mt-4 w-full" onClick={() => setEditing('new')}><Plus size={18} /> Add a medicine</Btn>
          </div>
        </section>
      )}

      {doses.length > 0 && (
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
            {meds.filter(m => m.prn).map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3">
                <span className="w-12 text-xs font-bold text-ink-3">as needed</span>
                <p className="min-w-0 flex-1 truncate font-bold">{m.label}</p>
                <button onClick={() => dispatch({ type: 'add', event: { kind: 'med', medId: m.id, status: 'taken', prn: true } })} className="rounded-full bg-surface-2 px-3 py-2 text-xs font-bold">Log a dose</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {ctx.adherence.some(a => a.due > 0) && (
        <section className="px-5 pt-8">
          <H2>Last 2 weeks</H2>
          <div className="space-y-3">
            {ctx.adherence.filter(a => a.due > 0).map(a => {
              const top = a.reasons[0]
              return (
                <Card key={a.med.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Ring pct={a.pct ?? 0} />
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{a.med.label}</p>
                      <p className="text-sm text-ink-2">{a.taken} of {a.due} doses taken</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {a.bySlot.filter(s => s.pct != null).map(s => (
                          <span key={s.time} className="num rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: s.pct >= 85 ? 'var(--calm-soft)' : s.pct >= 65 ? 'var(--mild-soft)' : 'var(--flare-soft)' }}>{s.time} · {s.pct}%</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {top && (
                    <div className="mt-4 rounded-2xl bg-surface-2 p-3.5">
                      <p className="text-sm"><span className="font-bold">Most common barrier:</span> “{top[0]}” ({top[1]}×)</p>
                      <p className="mt-1 text-sm text-ink-2">{BARRIER_TIPS[top[0]] || 'Your doctor or pharmacist can help find a routine that fits.'}</p>
                    </div>
                  )}
                  {a.daysLeft != null && a.med.supply > 0 && a.daysLeft <= 10 && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><PackageOpen size={16} className="text-accent" /> About {a.daysLeft} days left — time to arrange a refill.</p>
                  )}
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {(meds.length > 0 || editing) && (
        <section className="px-5 pt-8">
          <H2 action={!editing && <button onClick={() => setEditing('new')} className="inline-flex items-center gap-1 text-sm font-bold text-primary"><Plus size={16} />Add</button>}>Your medicines</H2>
          {editing && <MedForm med={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
          <div className="space-y-2">
            {meds.filter(m => editing === 'new' || editing?.id !== m.id).map(m => {
              const kb = medById[m.kbId]
              const isOpen = open === m.id
              return (
                <div key={m.id} className="overflow-hidden rounded-[20px] border border-line bg-surface">
                  <div className="flex items-center gap-2 px-4 py-3.5">
                    <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-extrabold">{m.label}</p>
                        <p className="truncate text-sm text-ink-2">{kb ? kb.kind : 'Your own medicine'} · {m.prn ? 'as needed' : m.times.length ? m.times.join(', ') : 'no times set'}</p>
                      </div>
                      <ChevronDown className={`shrink-0 text-ink-3 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="rise border-t border-line">
                      {kb ? <MedFacts kb={kb} onAsk={() => nav('/ask', { state: { q: `Tell me more about ${kb.name}` } })} /> : (
                        <p className="flex gap-2 px-4 py-3.5 text-sm"><Info size={16} className="mt-0.5 shrink-0 text-ink-3" />IBSync can't explain this medicine, so it won't guess. Your pharmacist can tell you what it's for and how to take it. Reminders and tracking still work.</p>
                      )}
                      {m.note && <p className="px-4 pb-3 text-sm text-ink-2">Your note: {m.note}</p>}
                      <div className="flex gap-2 border-t border-line px-4 py-3">
                        <button onClick={() => { setEditing(m); setOpen(null) }} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-2 text-sm font-bold"><Pencil size={15} />Edit</button>
                        <button onClick={() => { if (confirm(`Remove ${m.label}? Past logs stay in your history.`)) dispatch({ type: 'removeMed', id: m.id }) }} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold text-ink-2 hover:bg-surface-2"><Trash2 size={15} />Remove</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function MedForm({ med, onClose }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(med?.label || '')
  const [prn, setPrn] = useState(med?.prn || false)
  const [times, setTimes] = useState(med?.times?.length ? med.times : ['08:00'])
  const [note, setNote] = useState(med?.note || '')
  const [supply, setSupply] = useState(med?.supply ?? '')
  const kb = findMed(name)

  const save = () => {
    dispatch({ type: 'saveMed', med: {
      id: med?.id || uid('m_'), kbId: kb?.id || null, label: name.trim(),
      prn, times: prn ? [] : [...new Set(times.filter(Boolean))].sort(), note: note.trim(), supply: +supply || 0,
    } })
    onClose()
  }

  return (
    <div className="rise mb-3 rounded-[22px] border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-extrabold">{med ? 'Edit medicine' : 'Add a medicine'}</p>
        <button aria-label="Close" onClick={onClose} className="text-ink-3 hover:text-ink"><X size={20} /></button>
      </div>
      <label className="block">
        <span className="text-sm font-bold text-ink-2">Name and strength (as on the box)</span>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Buscopan 10 mg" className="mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none focus:border-ink-3" />
      </label>
      {name.length > 2 && (
        <p className={`mt-2 rounded-xl px-3 py-2 text-sm ${kb ? 'bg-calm-soft' : 'bg-surface-2 text-ink-2'}`}>
          {kb ? <>Recognised as <strong>{kb.name}</strong> ({kb.kind.toLowerCase()}). We'll show what it's for.</> : 'Not in our medicine guide — you can still add it for reminders. Ask your pharmacist what it\'s for.'}
        </p>
      )}

      <p className="mt-4 mb-1.5 text-sm font-bold text-ink-2">How do you take it?</p>
      <div className="flex gap-2">
        <Chip on={!prn} onClick={() => setPrn(false)}>At set times</Chip>
        <Chip on={prn} onClick={() => setPrn(true)}>Only when needed</Chip>
      </div>

      {!prn && (
        <div className="mt-3 space-y-2">
          {times.map((tm, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="time" value={tm} onChange={e => setTimes(ts => ts.map((x, j) => j === i ? e.target.value : x))} aria-label={`Dose time ${i + 1}`} className="num h-12 flex-1 rounded-2xl border border-line bg-bg px-4 font-bold outline-none" />
              {times.length > 1 && <button aria-label="Remove time" onClick={() => setTimes(ts => ts.filter((_, j) => j !== i))} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-2"><X size={18} /></button>}
            </div>
          ))}
          <button onClick={() => setTimes(ts => [...ts, '20:00'])} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><Plus size={16} />Add another time</button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-[1fr_110px] gap-2">
        <label className="block">
          <span className="text-sm font-bold text-ink-2">Note from your label</span>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. before meals" className="mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink-2">Doses left</span>
          <input type="number" min={0} value={supply} onChange={e => setSupply(e.target.value)} placeholder="—" className="num mt-1 h-12 w-full rounded-2xl border border-line bg-bg px-4 outline-none" />
        </label>
      </div>
      <p className="mt-2 text-xs text-ink-3">Use the times and amounts your doctor or label gives. IBSync only reminds — it never sets doses.</p>
      <Btn className="mt-4 w-full" disabled={!name.trim() || (!prn && !times.some(Boolean))} onClick={save}>{med ? 'Save changes' : 'Add medicine'}</Btn>
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
    <div className="space-y-3 px-4 pb-4 pt-3">
      {rows.map(([k, v]) => (
        <div key={k}><p className="text-xs font-bold text-ink-3">{k}</p><p className="text-[0.95rem] leading-snug">{v}</p></div>
      ))}
      <p className="text-xs text-ink-3">General information. Your prescription label and pharmacist come first.</p>
      {onAsk && <button onClick={onAsk} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary"><MessageCircleQuestion size={16} /> Ask a question about it</button>}
    </div>
  )
}
