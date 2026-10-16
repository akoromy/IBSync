// Illustrative SVG pieces: pebbles (day status), Bristol stool icons, pain faces.
// Deliberately abstract and soft — nothing graphic.
import { statusColor } from './ui.jsx'

// Seven slightly different pebble outlines so the week strip feels hand-placed
const PEBBLES = [
  'M8 22c-2-8 4-16 14-17 9-1 17 4 18 12 1 9-6 15-15 16C15 34 10 30 8 22z',
  'M6 19c1-9 9-14 18-13 9 1 15 7 14 15-1 8-8 13-17 12C12 32 5 27 6 19z',
  'M9 20c0-9 7-15 16-14 8 1 14 8 13 16-1 7-8 12-16 11C14 32 9 28 9 20z',
  'M7 21c-1-8 6-15 15-15 9 0 16 6 16 14 0 9-7 14-16 14-8 0-14-5-15-13z',
  'M8 18c2-8 10-12 18-11 8 2 13 9 11 17-2 7-9 11-17 10C11 33 6 26 8 18z',
  'M6 22c-1-9 7-16 16-16 8 0 16 5 16 13 0 9-8 15-17 15C13 34 7 29 6 22z',
  'M9 19c1-8 8-13 16-12 9 1 14 8 13 16-2 8-9 11-17 10C13 32 8 27 9 19z',
]

export function Pebble({ status, i = 0, size = 44, today = false, label }) {
  const c = statusColor(status)
  const none = status === 'none'
  return (
    <svg width={size} height={size * .9} viewBox="0 0 44 40" role="img" aria-label={label}>
      <path d={PEBBLES[i % 7]} fill={none ? 'none' : c} stroke={none ? 'var(--ink-3)' : 'none'} strokeWidth={none ? 1.6 : 0} strokeDasharray={none ? '3 3' : undefined} opacity={none ? .7 : 1} />
      {status === 'flare' && <path d="M22 15.5 26.2 23.5H17.8z" fill="var(--surface)" opacity=".75" />}
      {status === 'mild' && <rect x="18.8" y="16.8" width="6.4" height="6.4" rx="1.6" fill="var(--surface)" opacity=".75" />}
      {status === 'calm' && <circle cx="22" cy="20" r="3.2" fill="var(--surface)" opacity=".75" />}
      {today && <circle cx="22" cy="38.5" r="1.6" fill="var(--ink)" />}
    </svg>
  )
}

export function PebbleDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <radialGradient id="pebble-sheen" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export const BRISTOL = [
  { type: 1, name: 'Separate hard lumps', short: 'Hard lumps', zone: 'hard' },
  { type: 2, name: 'Lumpy and sausage-like', short: 'Lumpy', zone: 'hard' },
  { type: 3, name: 'Sausage with cracks', short: 'Cracked', zone: 'ok' },
  { type: 4, name: 'Smooth and soft', short: 'Smooth', zone: 'ok' },
  { type: 5, name: 'Soft blobs, clear edges', short: 'Soft blobs', zone: 'ok' },
  { type: 6, name: 'Mushy, ragged edges', short: 'Mushy', zone: 'loose' },
  { type: 7, name: 'Watery, no solid pieces', short: 'Watery', zone: 'loose' },
]

export function BristolIcon({ type, size = 56, color = 'var(--accent)' }) {
  const f = { fill: color }
  const shapes = {
    1: <g {...f}><circle cx="16" cy="22" r="6" /><circle cx="30" cy="18" r="5" /><circle cx="42" cy="25" r="5.5" /><circle cx="25" cy="34" r="5" /><circle cx="39" cy="38" r="4.5" /></g>,
    2: <g {...f}><path d="M10 30c0-6 4-9 8-9 2-4 7-5 10-3 3-3 9-3 12 1 5 0 8 4 8 8s-3 8-8 8c-3 3-8 3-11 1-3 2-8 2-11-1-5 0-8-2-8-5z" /></g>,
    3: <g {...f}><path d="M8 29c0-6 6-9 12-9h18c7 0 12 3 12 9s-5 9-12 9H20c-6 0-12-3-12-9z" /><path d="M22 21v5M31 32v6M40 21v4" stroke="var(--surface)" strokeWidth="2.2" strokeLinecap="round" /></g>,
    4: <g {...f}><path d="M7 31c0-6 5-10 13-10 7 0 10 3 17 3 9 0 13 2 13 7s-4 8-13 8c-7 0-10-2-17-2-8 0-13-1-13-6z" /></g>,
    5: <g {...f}><ellipse cx="17" cy="27" rx="9" ry="6.5" /><ellipse cx="36" cy="24" rx="8.5" ry="6" /><ellipse cx="29" cy="38" rx="8" ry="5.5" /></g>,
    6: <g {...f}><path d="M8 32c2-6 7-5 9-9 3-4 8-1 11-4 4-3 9 0 12 2 4 2 9 2 9 7 0 6-6 6-9 9-4 3-9 0-13 2-5 2-9 1-13 0-4-1-7-3-6-7z" opacity=".9" /></g>,
    7: <g {...f}><path d="M6 34c5-3 9 2 15-1 6-3 10 2 16-1 5-3 9 0 13 1v8c-4-1-8-3-13 0-6 3-10-2-16 1-6 3-10-1-15 1z" opacity=".55" /><path d="M10 26c4-2 7 1 11 0M30 24c4-2 7 1 11 0" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".75" /></g>,
  }
  return <svg width={size} height={size * .8} viewBox="0 0 56 48" aria-hidden>{shapes[type]}</svg>
}

export const PAIN_WORDS = [
  'No pain', 'Barely there', 'Mild ache', 'Uncomfortable', 'Distracting', 'Hard to ignore',
  'Cramping', 'Strong cramping', 'Severe', 'Very severe', 'Worst imaginable',
]

export function PainFace({ level, size = 40 }) {
  const status = level >= 6 ? 'flare' : level >= 3 ? 'mild' : 'calm'
  const c = statusColor(status)
  const mouth = level <= 1 ? 'M14 25c3 3 9 3 12 0' : level <= 3 ? 'M14 26h12' : level <= 6 ? 'M14 27c3-2 9-2 12 0' : 'M13 28c3-4 11-4 14 0'
  const brow = level >= 7
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="17" fill={c} opacity=".18" />
      <circle cx="20" cy="20" r="17" fill="none" stroke={c} strokeWidth="2" />
      <circle cx="14.5" cy="17" r="1.8" fill="var(--ink)" />
      <circle cx="25.5" cy="17" r="1.8" fill="var(--ink)" />
      {brow && <path d="M11 12.5l6 2M29 12.5l-6 2" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />}
      <path d={mouth} stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3c7 0 13 5 13 12 0 8-6 14-13 14S3 23 3 15C3 8 9 3 16 3z" fill="var(--primary)" />
      <path d="M10 13c2-3 5-3 7-1s5 2 6-1M9 19c2-3 5-3 7-1s5 2 7-1" stroke="var(--primary-ink)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
