import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SendHorizontal, ShieldCheck, ClipboardPlus, RotateCcw } from 'lucide-react'
import { useStore } from '../store.jsx'
import { chatReply } from '../ai/client.js'
import { AiSource, Md } from '../components/ui.jsx'
import { Logo } from '../components/art.jsx'

const STARTERS = [
  'What are my trigger foods?',
  'What is mebeverine for?',
  'How has this week been?',
  'Is stress affecting my gut?',
  'Can I take double my loperamide?',
  'What does my stool pattern mean?',
]

export default function Ask() {
  const { state, dispatch, ctx, t } = useStore()
  const loc = useLocation()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState({})
  const end = useRef(null)
  const msgs = state.chat
  const sentInitial = useRef(false)

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs.length, busy])

  const send = async q => {
    const content = (q ?? text).trim()
    if (!content || busy) return
    setText('')
    const hist = [...msgs, { role: 'user', content }]
    dispatch({ type: 'chat', list: hist })
    setBusy(true)
    const r = await chatReply(hist, ctx, state.settings)
    dispatch({ type: 'chat', list: [...hist, { role: 'assistant', content: r.text, source: r.source, route: r.route }] })
    if (r.route === 'emergency') dispatch({ type: 'concerns', list: [...state.concerns, `Reported in chat: "${content}"`] })
    setBusy(false)
  }

  useEffect(() => {
    if (loc.state?.q && !sentInitial.current) { sentInitial.current = true; send(loc.state.q) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addConcern = (i, q) => {
    dispatch({ type: 'concerns', list: [...state.concerns, q] })
    setAdded(a => ({ ...a, [i]: true }))
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <h1 className="text-[1.75rem] font-black leading-tight tracking-[-0.02em]">{t('ask')} IBSync</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-2"><ShieldCheck size={15} className="text-primary" />Explains — never prescribes or changes your treatment.</p>
        </div>
        {msgs.length > 0 && <button onClick={() => dispatch({ type: 'chat', list: [] })} aria-label="New chat" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-2"><RotateCcw size={17} /></button>}
      </header>

      <div className="flex-1 space-y-4 px-5 pb-40">
        {msgs.length === 0 && (
          <div className="pt-4">
            <div className="rounded-[22px] bg-surface-2 p-5">
              <Logo size={34} />
              <p className="mt-3 text-lg font-extrabold leading-snug">Hi {state.profile.name}. I know your last 4 weeks of logs and your medicines.</p>
              <p className="mt-1.5 text-ink-2">Ask about foods, symptoms, stool, stress, or what a medicine is for. For anything urgent I'll point you to the right care.</p>
            </div>
            <p className="mt-6 mb-2 text-sm font-bold text-ink-2">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map(s => <button key={s} onClick={() => send(s)} className="rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm font-semibold hover:border-ink-3">{s}</button>)}
            </div>
          </div>
        )}

        {msgs.map((m, i) => m.role === 'user' ? (
          <div key={i} className="flex justify-end">
            <p className="max-w-[85%] rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-bg">{m.content}</p>
          </div>
        ) : (
          <div key={i} className="rise max-w-[94%]">
            <div className={`rounded-[20px] rounded-bl-md px-4 py-3 leading-relaxed ${m.route === 'emergency' || m.route === 'crisis' ? 'border border-flare/40 bg-flare-soft' : m.route === 'dose_change' || m.route === 'unknown_med' ? 'border border-mild/40 bg-mild-soft' : 'border border-line bg-surface'}`}>
              <Md text={m.content} />
            </div>
            <div className="mt-1.5 flex items-center gap-3 px-1">
              <AiSource source={m.source} />
              {m.route !== 'crisis' && (
                <button onClick={() => addConcern(i, msgs[i - 1]?.content)} disabled={added[i]} className="inline-flex items-center gap-1 text-[11px] font-bold text-primary disabled:text-ink-3">
                  <ClipboardPlus size={13} />{added[i] ? 'Added to doctor list' : 'Ask my doctor this'}
                </button>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="typing flex gap-1 px-2 py-3" aria-label="IBSync is typing">{[0, 1, 2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-ink-3" />)}</div>}
        <div ref={end} />
      </div>

      <form onSubmit={e => { e.preventDefault(); send() }} className="fixed inset-x-0 bottom-[86px] z-20">
        <div className="mx-auto max-w-[460px] px-4">
          <div className="flex items-end gap-2 rounded-[24px] border border-line bg-surface p-1.5 pl-4 shadow-soft">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder={t('askPlaceholder')}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 outline-none placeholder:text-ink-3" aria-label="Message" />
            <button type="submit" disabled={!text.trim() || busy} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink"><SendHorizontal size={19} /></button>
          </div>
        </div>
      </form>
    </div>
  )
}
