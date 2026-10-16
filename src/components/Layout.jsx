import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { Home, LineChart, Plus, Pill, MessageCircleHeart, HeartPulse, Menu, X, CalendarDays, ClipboardList, FileDown, CalendarHeart, History, Wind, Settings2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStore } from '../store.jsx'
import FlareMode from '../pages/FlareMode.jsx'
import { PebbleDefs } from './art.jsx'
import Welcome from './Welcome.jsx'

export default function Layout() {
  const { t, state } = useStore()
  const [flare, setFlare] = useState(false)
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => { setMenu(false) }, [loc.pathname, loc.search])

  const items = [
    { to: '/', icon: Home, label: t('today') },
    { to: '/insights', icon: LineChart, label: t('insights') },
    { to: '/log', icon: Plus, label: t('log'), center: true },
    { to: '/ask', icon: MessageCircleHeart, label: t('ask') },
    { to: '/care', icon: HeartPulse, label: t('care') },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <PebbleDefs />
      <div className="relative mx-auto min-h-screen w-full max-w-[460px] pb-28">
        <Outlet context={{ openFlare: () => setFlare(true), openMenu: () => setMenu(true) }} />
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

      {menu && <SideMenu onClose={() => setMenu(false)} onFlare={() => { setMenu(false); setFlare(true) }} />}
      {flare && <FlareMode onClose={() => setFlare(false)} />}
      {!state.onboarded && <Welcome />}
    </div>
  )
}

export function MenuButton() {
  const ctx = useOutletContext()
  if (!ctx?.openMenu) return null
  return (
    <button onClick={ctx.openMenu} aria-label="Open menu"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink">
      <Menu size={19} />
    </button>
  )
}

function SideMenu({ onClose, onFlare }) {
  const { t } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const go = to => { nav(to); onClose() }
  const groups = [
    { title: 'Every day', items: [
      { to: '/', icon: Home, label: t('today'), sub: 'Flare risk, plan and quick logs' },
      { to: '/log', icon: Plus, label: 'Log something', sub: 'Meal, symptoms, stool, water' },
      { to: '/timeline', icon: History, label: t('timeline'), sub: 'Your days in order, with links' },
    ] },
    { title: 'Understand', items: [
      { to: '/insights', icon: LineChart, label: t('insights'), sub: 'Patterns in food, sleep, stress' },
      { to: '/ask', icon: MessageCircleHeart, label: 'Ask IBSync', sub: 'Chat about your own data' },
      { to: '/meds', icon: Pill, label: 'Medicines', sub: 'Doses, routine and facts' },
    ] },
    { title: 'Care & doctor visits', items: [
      { to: '/care?s=visit', icon: CalendarHeart, label: 'Next visit', sub: 'Your visit pass and readiness' },
      { to: '/care?s=schedule', icon: CalendarDays, label: 'Schedule & check-ups', sub: 'Appointments, tests, reminders' },
      { to: '/care?s=questions', icon: ClipboardList, label: 'Questions for my doctor', sub: 'Suggested and your own' },
      { to: '/care?s=report', icon: FileDown, label: 'Doctor summary (PDF)', sub: '28 days on one page' },
    ] },
  ]
  const here = to => (loc.pathname + loc.search) === to || (to === '/' && loc.pathname === '/')
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <button aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" />
      <aside className="menu-in absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col overflow-y-auto bg-bg shadow-soft">
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <span className="font-display text-2xl font-extrabold tracking-[-0.02em]">IBSync</span>
          <button onClick={onClose} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"><X size={19} /></button>
        </div>
        <nav className="flex-1 space-y-5 px-3 pb-4">
          {groups.map(g => (
            <div key={g.title}>
              <p className="px-3 pb-1.5 text-xs font-bold tracking-wide text-ink-3 uppercase">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map(it => (
                  <li key={it.to}>
                    <button onClick={() => go(it.to)} aria-current={here(it.to) ? 'page' : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${here(it.to) ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2'}`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${here(it.to) ? 'bg-surface text-primary' : 'bg-surface-2 text-ink-2'}`}><it.icon size={18} /></span>
                      <span className="min-w-0"><span className="block font-bold">{it.label}</span><span className="block truncate text-xs text-ink-2">{it.sub}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-line px-5 py-4">
          <button onClick={onFlare} className="flex w-full items-center gap-3 rounded-2xl bg-flare-soft px-3 py-3 text-left font-bold text-flare"><Wind size={18} />{t('flareMode')} — for a bad day</button>
          <button onClick={() => go('/settings')} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left font-bold text-ink-2 hover:bg-surface-2"><Settings2 size={18} />{t('settings')} · language, text size</button>
        </div>
      </aside>
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
      <div className="flex shrink-0 items-center gap-2">{right}<MenuButton /></div>
    </header>
  )
}
