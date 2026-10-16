import { isSameDay, parseISO, setHours, setMinutes, startOfDay } from 'date-fns'

export function todaysDoses(events, profile, now = new Date()) {
  const day = startOfDay(now)
  const medEv = events.filter(e => e.kind === 'med' && isSameDay(parseISO(e.ts), now))
  const out = []
  for (const m of profile.meds) {
    for (const time of m.times) {
      const [h, mm] = time.split(':').map(Number)
      const at = setMinutes(setHours(day, h), mm)
      const ev = medEv.find(e => e.medId === m.id && e.scheduled && parseISO(e.scheduled).getHours() === h)
      out.push({
        key: `${m.id}-${time}`, med: m, time, at,
        status: ev ? ev.status : at < now ? 'due' : 'upcoming',
        overdue: !ev && (now - at) > 60 * 60000,
        event: ev,
      })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}
