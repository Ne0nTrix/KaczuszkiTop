import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eur, hourLabel } from "../../lib/format"
import { useMarket } from "../../state/MarketProvider"
import { AXIS, ChartTooltipCard, SERIES } from "../charts/chartTheme"

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { hour: number; price: number } }>
}

function PriceTooltip({ active, payload, best }: TooltipProps & { best: number[] }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <ChartTooltipCard
      title={`${hourLabel(point.hour)} - ${hourLabel(point.hour + 1)}`}
      rows={[{ label: 'Market price', value: `${eur(point.price, 3)} / kWh`, color: SERIES.price }]}
      footer={best.includes(point.hour) ? <p className="mt-1 text-[11px] font-extrabold text-leaf-700">Best selling window</p> : null}
    />
  )
}

export function PriceChart({ height = 240 }: { height?: number }) {
  const { prices, bestHours, simHour, currentPrice } = useMarket()
  const minutes = new Date().getMinutes() / 60
  const data = prices.map((p) => ({ ...p, price: p.hour === simHour ? currentPrice : p.price }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 18, right: 12, left: -8, bottom: 0 }}>
        <defs>   
          <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES.price} stopOpacity={0.35} />
            <stop offset="100%" stopColor={SERIES.price} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={AXIS.grid} />
        {bestHours.map((h) => (
          <ReferenceArea key={h} x1={h - 0.5} x2={h + 0.5} fill="#5FAE4B" fillOpacity={0.14} stroke="none" ifOverflow="extendDomain" />
        ))}
        <XAxis
          dataKey="hour"
          type="number"
          domain={[-0.5, 23.5]}
          ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
          tickFormatter={(h: number) => hourLabel(h)}
          tick={AXIS.tick}
          axisLine={{ stroke: AXIS.line }}
          tickLine={false}
        />
        <YAxis tickFormatter={(v: number) => v.toFixed(2)} tick={AXIS.tick} axisLine={false} tickLine={false} width={48} domain={[0.08, 'auto']} />
        <Tooltip content={<PriceTooltip best={bestHours} />} cursor={{ stroke: 'var(--color-ink-muted)', strokeDasharray: '3 3' }} />  
        <Area type="monotone" dataKey="price" stroke={SERIES.price} strokeWidth={2} fill="url(#price-fill)" isAnimationActive={false} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
        <ReferenceLine
          x={simHour + minutes}
          stroke="var(--color-leaf-700)"
          strokeWidth={2}
          strokeDasharray="4 3"
          label={{ value: 'Now', position: 'top', fill: 'var(--color-leaf-700)', fontSize: 11, fontWeight: 800 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
