import { Sparkles, Cpu } from 'lucide-react'

export function Card({ className = '', children, tone = 'surface', ...rest }) {
  const tones = {
    surface: 'bg-surface border border-line shadow-soft',
    soft: 'bg-surface-2',
    primary: 'bg-primary-soft',
    accent: 'bg-accent-soft',
    plain: '',
  }
  return <div className={`rounded-[22px] ${tones[tone]} ${className}`} {...rest}>{children}</div>
}

export function H2({ children, action, className = '' }) {
  return (
    <div className={`flex items-end justify-between gap-3 mb-3 ${className}`}>
      <h2 className="text-[1.05rem] font-extrabold tracking-[-0.01em] text-ink">{children}</h2>
      {action}
    </div>
  )
}

const STATUS = {
  calm: { c: 'var(--calm)', bg: 'var(--calm-soft)' },
  mild: { c: 'var(--mild)', bg: 'var(--mild-soft)' },
  flare: { c: 'var(--flare)', bg: 'var(--flare-soft)' },
  none: { c: 'var(--ink-3)', bg: 'var(--surface-2)' },
}
export const statusColor = s => STATUS[s]?.c || STATUS.none.c
export const statusBg = s => STATUS[s]?.bg || STATUS.none.bg

export function StatusPill({ status, t }) {
  const label = { calm: t('calm'), mild: t('mild'), flare: t('flare'), none: t('notLogged') }[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: statusBg(status), color: 'var(--ink)' }}>
      <StatusGlyph status={status} />
      {label}
    </span>
  )
}

// shape + colour so status is never colour-only
export function StatusGlyph({ status, size = 10 }) {
  const c = statusColor(status)
  if (status === 'flare') return <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden><path d="M5 .8 9.4 9H.6z" fill={c} /></svg>
  if (status === 'mild') return <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden><rect x="1" y="1" width="8" height="8" rx="2" fill={c} /></svg>
  if (status === 'calm') return <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden><circle cx="5" cy="5" r="4.2" fill={c} /></svg>
  return <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden><circle cx="5" cy="5" r="3.6" fill="none" stroke={c} strokeWidth="1.4" /></svg>
}

export function Chip({ on, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[40px] rounded-full px-3.5 text-[0.9rem] font-semibold border transition-colors ${on ? 'bg-ink text-bg border-ink' : 'bg-surface text-ink border-line hover:border-ink-3'} ${className}`}
    >
      {children}
    </button>
  )
}

export function Segmented({ value, onChange, options, className = '' }) {
  return (
    <div role="tablist" className={`flex gap-1 rounded-full bg-surface-2 p-1 scroll-x ${className}`}>
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${value === o.value ? 'bg-surface text-ink shadow-soft' : 'text-ink-2 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function AiSource({ source, className = '' }) {
  if (!source) return null
  const local = source === 'local'
  const guard = source === 'guardrail'
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-ink-3 ${className}`}>
      {local ? <Cpu size={12} /> : <Sparkles size={12} />}
      {guard ? 'Safety response' : local ? 'On-device insight' : `AI · ${source}`}
    </span>
  )
}

export function Btn({ children, variant = 'primary', className = '', ...rest }) {
  const v = {
    primary: 'bg-primary text-primary-ink hover:brightness-105',
    ghost: 'bg-transparent text-ink border border-line hover:bg-surface-2',
    soft: 'bg-surface-2 text-ink hover:brightness-[.98]',
    accent: 'bg-accent text-white hover:brightness-105',
  }
  return (
    <button className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-4 font-bold transition ${v[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />
}

// Lightweight markdown: **bold**, _italic_, "- " bullets, paragraphs
export function Md({ text }) {
  const blocks = text.split(/\n{2,}/)
  const inline = s => s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((p, i) =>
    p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('_') && p.endsWith('_') && p.length > 2 ? <em key={i} className="text-ink-2">{p.slice(1, -1)}</em> : p)
  return blocks.map((b, i) => {
    const lines = b.split('\n')
    if (lines.every(l => /^\s*[-•]\s/.test(l))) {
      return <ul key={i} className="my-1.5 space-y-1 pl-4 list-disc marker:text-ink-3">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s/, ''))}</li>)}</ul>
    }
    return <p key={i} className="my-1.5 first:mt-0 last:mb-0">{lines.map((l, j) => <span key={j}>{inline(l)}{j < lines.length - 1 && <br />}</span>)}</p>
  })
}
