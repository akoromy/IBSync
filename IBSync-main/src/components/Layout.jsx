import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, LineChart, Plus, Pill, MessageCircleHeart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import FlareMode from '../pages/FlareMode.jsx'
import { PebbleDefs } from './art.jsx'

export default function Layout() {
  const { t } = useStore()
  const [flare, setFlare] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])

  const items = [
    { to: '/', icon: Home, label: t('today') },
    { to: '/insights', icon: LineChart, label: t('insights') },
    { to: '/log', icon: Plus, label: t('log'), center: true },
    { to: '/meds', icon: Pill, label: t('meds') },
    { to: '/ask', icon: MessageCircleHeart, label: t('ask') },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <PebbleDefs />
      <div className="relative mx-auto min-h-screen w-full max-w-[460px] pb-28">
        <Outlet context={{ openFlare: () => setFlare(true) }} />
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-[460px] px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
          <div className="flex items-end justify-between rounded-[26px] border border-line bg-surface/95 px-2 py-1.5 shadow-soft backdrop-blur">
            {items.map(it => it.center ? (
              <button key={it.to} onClick={() => nav('/log')} aria-label={it.label}
                className="-mt-6 flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-primary text-primary-ink shadow-soft ring-4 ring-bg transition active:scale-95">
                <Plus size={28} strokeWidth={2.6} />
              </button>
            ) : (
              <NavLink key={it.to} to={it.to} end
                className={({ isActive }) => `flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-bold ${isActive ? 'text-primary' : 'text-ink-3 hover:text-ink-2'}`}>
                {({ isActive }) => (<><it.icon size={22} strokeWidth={isActive ? 2.5 : 2} /><span>{it.label}</span></>)}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {flare && <FlareMode onClose={() => setFlare(false)} />}
    </div>
  )
}

export function PageHeader({ title, sub, right, back }) {
  const nav = useNavigate()
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-4">
      <div className="min-w-0">
        {back && <button onClick={() => nav(-1)} className="mb-1 text-sm font-bold text-ink-2 hover:text-ink">← Back</button>}
        <h1 className="text-[1.75rem] leading-tight font-black tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[0.95rem] text-ink-2">{sub}</p>}
      </div>
      {right}
    </header>
  )
}
