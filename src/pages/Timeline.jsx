import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { useStore } from '../store.jsx'
import { PageHeader } from '../components/Layout.jsx'
import { Pebble } from '../components/art.jsx'
import { StatusPill } from '../components/ui.jsx'
import { mealSymptomLinks } from '../lib/analytics.js'
import { TodayFeed } from './Today.jsx'

export default function Timeline() {
  const { state, ctx, t } = useStore()
  const loc = useLocation()
  const days = ctx.series.slice(-14).reverse()
  const [sel, setSel] = useState(loc.state?.day || days[0].key)
  const day = days.find(d => d.key === sel) || ctx.series.find(d => d.key === sel) || days[0]
  const links = mealSymptomLinks(state.events, day.date)

  return (
    <div>
      <PageHeader back title={t('timeline')} sub="Meals, symptoms and stool in order — with likely links." />
      <div className="scroll-x flex gap-1.5 px-5 pb-2">
        {days.map((d, i) => (
          <button key={d.key} onClick={() => setSel(d.key)} aria-pressed={sel === d.key}
            className={`flex shrink-0 flex-col items-center rounded-2xl px-2 py-1.5 ${sel === d.key ? 'bg-surface border border-line shadow-soft' : ''}`}>
            <Pebble status={d.status} i={i} size={34} />
            <span className="text-[11px] font-bold text-ink-2">{format(d.date, 'EEE d')}</span>
          </button>
        ))}
      </div>
      <div className="px-5 pt-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-extrabold">{format(day.date, 'EEEE, d MMMM')}</h2>
          <StatusPill status={day.status} t={t} />
        </div>
        <div className="mb-5 grid grid-cols-4 gap-2 text-center">
          {[
            ['Worst pain', day.maxPain != null ? `${day.maxPain}/10` : '–'],
            ['Stools', day.stools],
            ['Water', `${(day.water / 1000).toFixed(1)}L`],
            ['Stress', day.stress ?? '–'],
          ].map(([k, v]) => <div key={k} className="rounded-2xl bg-surface-2 py-2.5"><p className="num text-lg font-black">{v}</p><p className="text-[11px] font-bold text-ink-2">{k}</p></div>)}
        </div>
        <TodayFeed events={state.events} links={links} day={day.date} />
      </div>
    </div>
  )
}
