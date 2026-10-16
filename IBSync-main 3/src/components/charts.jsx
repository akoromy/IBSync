import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Cell, AreaChart, Area } from 'recharts'

const tip = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--shadow)', fontSize: 13, color: 'var(--ink)' },
  labelStyle: { fontWeight: 800, color: 'var(--ink)' },
  itemStyle: { color: 'var(--ink-2)' },
  cursor: { stroke: 'var(--ink-3)', strokeWidth: 1, strokeDasharray: '3 3' },
}

export function PainTrend({ data, height = 190 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
        <defs>
          <linearGradient id="painFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={6} />
        <YAxis domain={[0, 10]} ticks={[0, 3, 6, 10]} tickLine={false} axisLine={false} />
        <ReferenceLine y={6} stroke="var(--flare)" strokeDasharray="4 4" strokeOpacity={.6} label={{ value: 'flare', position: 'insideTopRight', fill: 'var(--ink-3)', fontSize: 11 }} />
        <Tooltip {...tip} formatter={v => [`${v}/10`, 'Worst pain']} />
        <Area type="monotone" dataKey="maxPain" stroke="var(--accent)" strokeWidth={2.2} fill="url(#painFill)" dot={false} activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function SmallLine({ data, dataKey, name, unit = '', color = 'var(--primary)', domain, height = 110, goal }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={9} />
        <YAxis domain={domain || ['auto', 'auto']} tickLine={false} axisLine={false} width={44} />
        {goal != null && <ReferenceLine y={goal} stroke="var(--ink-3)" strokeDasharray="4 4" />}
        <Tooltip {...tip} formatter={v => [`${v}${unit}`, name]} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4.5, stroke: 'var(--surface)', strokeWidth: 2 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BristolBars({ dist, height = 170 }) {
  const color = t => t <= 2 ? 'var(--accent)' : t >= 6 ? 'var(--mild)' : 'var(--calm)'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={dist.map(d => ({ ...d, label: `T${d.type}` }))} margin={{ top: 8, right: 4, left: -28, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip {...tip} cursor={{ fill: 'var(--surface-2)' }} formatter={v => [v, 'Stools']} labelFormatter={l => `Type ${l.slice(1)}`} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {dist.map(d => <Cell key={d.type} fill={color(d.type)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function HBars({ rows, max = 100, unit = '%' }) {
  // simple accessible horizontal bars in HTML (direct-labelled)
  return (
    <ul className="space-y-2.5">
      {rows.map(r => (
        <li key={r.label} title={`${r.label}: ${r.value}${unit}`}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="font-semibold">{r.label}</span>
            <span className="num font-bold text-ink-2">{r.value}{unit}{r.note ? <span className="font-normal text-ink-3"> · {r.note}</span> : null}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ width: `${Math.max(3, (r.value / max) * 100)}%`, background: r.color || 'var(--primary)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
