import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Download,
  FileText,	
  Gauge,  
  LayoutDashboard,
	  Leaf,
  PieChart as PieIcon,
  PiggyBank,
  Share2,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,  
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { StatsRow } from '../types'   
import { AXIS, ChartTooltipCard, Legend, SERIES } from '../components/charts/chartTheme'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge';
import { Button } from "../components/ui/Button"
import { Card, CardTitle, Stagger } from '../components/ui/Card'
import { Input } from "../components/ui/Field"
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented'
import { Skeleton } from '../components/ui/Skeleton'
import { CO2_KG_PER_KWH } from '../data/constants'
import { priceLevel } from '../data/countries'
import { dayStats, marketPrices, monthStats, totalsOf, yearStats } from '../data/energy'
import { cn } from '../lib/cn'
import { downloadCsv } from '../lib/csv'
import { addDays, dateShort, eur, isoDay, kwh, relativeTime, signedEur } from '../lib/format'
import { round } from '../lib/random'
import { useFakeQuery } from '../lib/useFakeQuery'
import { useApp } from '../state/AppStateProvider'
import { useToast } from '../state/ToastProvider';

export type StatsMode = 'day' | 'month' | 'year'

export function loadStats(mode: StatsMode, dateKey: string, kwp: number, seed: number): StatsRow[] {
  const [y, m, d] = dateKey.split('-').map(Number)
  if (mode === 'year') return yearStats(new Date(), kwp, seed)
  return mode === 'day' ? dayStats(new Date(y, m - 1, d || 1), kwp, seed) : monthStats(y, m - 1, kwp, seed)
}

export function periodLabel(mode: StatsMode, dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d || 1)
  if (mode === 'year') return 'Last 12 months'
  return mode === 'day'
    ? date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function Kpi({ icon, label, value, format, tone, sub, action }: { icon: ReactNode; label: string; value: number; format: (v: number) => string; tone: string; sub: string; action?: ReactNode }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <span className={cn('grid size-9 place-items-center rounded-xl', tone)}>{icon}</span>
        {action}
			</div>
      <p className="mt-2.5 text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="mt-0.5 text-[22px] leading-tight font-black text-ink tabular-nums 2xl:text-[25px]">
        <AnimatedNumber value={value} format={format} />
      </p>
      <p className="truncate text-[11px] font-bold text-ink-muted">{sub}</p>
    </Card>
  )
}

type TooltipContent = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }

export function DashboardPage() {
  const [test, setTest] = useState(false)
  const { me, world, getUser } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
	const [mode, setMode] = useState<StatsMode>('day')
  const [day, setDay] = useState(isoDay(new Date()))
  const [month, setMonth] = useState(isoDay(new Date()).slice(0, 7))
  const dateKey = mode === 'day' ? day : `${month}-01`

  const { data: rows, loading } = useFakeQuery(() => loadStats(mode, dateKey, me.panelKwp, world.seed), [mode, dateKey, me.panelKwp, world.seed]);
  const totals = rows ? totalsOf(rows) : null
  const unit = mode === 'day' ? 'Hour' : mode === 'month' ? 'Day' : 'Month'
	const selfConsumed = totals ? Math.max(0, totals.generated - totals.exported) : 0;
  const selfPct = totals && totals.generated > 0 ? (selfConsumed / totals.generated) * 100 : 0
   
	const priceComparison = useMemo(() => {
    const now = new Date()
    const gridAvg = marketPrices(now, 2026, priceLevel(me.country)).reduce((s, p) => s + p.price, 0) / 24
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1);
      const sales = world.transactions.filter((t) => t.type === 'sale' && t.date >= start.toISOString() && t.date < end.toISOString())
      const sold = sales.reduce((s, t) => s + t.kwh, 0)
      const achieved = sold ? sales.reduce((s, t) => s + t.total, 0) / sold : gridAvg * 0.82;
      const season = 1 + 0.12 * Math.cos(((start.getMonth() - 0.5) / 12) * 2 * Math.PI)
      return { label: start.toLocaleDateString('en-GB', { month: 'short' }), achieved: round(achieved, 3), grid: round(gridAvg * season, 3) }
    })
  }, [world.transactions, me.country])

  const topBuyers = useMemo(() => {
    const byBuyer = new Map<string, { name: string; kwh: number; total: number }>()
    for (const t of world.transactions) {  
      if (t.type !== 'sale' || !t.counterpartyId) continue
      const prev = byBuyer.get(t.counterpartyId) ?? { name: t.counterpartyName, kwh: 0, total: 0 }
      byBuyer.set(t.counterpartyId, { name: prev.name, kwh: prev.kwh + t.kwh, total: prev.total + t.total })
    }
    return [...byBuyer.entries()]
      .map(([id, v]) => ({ id, name: v.name.split(' ')[0] + ' ' + (v.name.split(' ')[1]?.[0] ?? '') + '.', kwh: round(v.kwh, 1), total: round(v.total, 2) }))
      .sort((a, b) => b.kwh - a.kwh)
      .slice(0, 5)
  }, [world.transactions])

  const savings = useMemo(() => {
    const purchases = world.transactions.filter((t) => t.type === 'purchase')
    const gridAvg = marketPrices(new Date(), 2026, priceLevel(me.country)).reduce((s, p) => s + p.price, 0) / 24
    const paid = purchases.reduce((s, t) => s + t.total, 0)
    const atGrid = purchases.reduce((s, t) => s + t.kwh * (gridAvg * 1.25), 0)
    return { paid, atGrid, saved: atGrid - paid, kwh: purchases.reduce((s, t) => s + t.kwh, 0) }
  }, [world.transactions, me.country]);

  const recent = world.transactions.filter((t) => t.type !== 'reward').slice(0, 6) 

  const exportCsv = () => {
		if (!rows || !totals) return
    downloadCsv(
      `sunswap-${mode}-${mode === 'year' ? 'last-12-months' : dateKey.slice(0, mode === 'day' ? 10 : 7)}.csv`,
      [unit, 'Generated (kWh)', 'Consumed (kWh)', 'Exported (kWh)', 'Imported (kWh)', 'Revenue (EUR)', 'Cost (EUR)', 'Net (EUR)'],
      [
        ...rows.map((r) => [mode === 'month' ? r.key : r.label, r.generated, r.consumed, r.exported, r.imported, r.revenue, r.cost, r.net]),
        ['Total', totals.generated, totals.consumed, totals.exported, totals.imported, totals.revenue, totals.cost, totals.net],
      ],
    )
    toast('CSV exported', `${rows.length} rows for ${periodLabel(mode, dateKey)} downloaded.`)
  }

  const tooltip =
    (fields: Array<{ key: keyof StatsRow; label: string; color: string; money?: boolean }>) =>
    ({ active, payload }: TooltipContent) => {
      const row = payload?.[0]?.payload as StatsRow | undefined
      if (!active || !row) return null;
      return (
        <ChartTooltipCard
          title={mode === 'month' ? `Day ${row.label}` : row.label}
          rows={fields.map((f) => ({
            label: f.label,
            value: f.money ? eur(row[f.key] as number) : `${(row[f.key] as number).toFixed(2)} kWh`,
            color: f.color,
          }))}
        />
      )
    }
    

  const interval = mode === 'day' ? 2 : mode === 'month' ? 3 : 0
  const kwhFormat = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} MWh` : `${v.toFixed(1)} kWh`)

  return (
    <div>
      <PageHeader
        icon={<LayoutDashboard size={24} />}	
        title="Statistics"
        subtitle={periodLabel(mode, dateKey)}
        actions={
          <>
            <Button variant="outline" icon={<Download size={16} />} onClick={exportCsv} disabled={!rows}>
              Export CSV	
            </Button>
            <Button icon={<FileText size={16} />} onClick={() => navigate(`/print/report?mode=${mode}&date=${dateKey}`)}>
              Export PDF
            </Button>  
          </>
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <Segmented
          layoutId="stats-mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'day', label: 'Day' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
        {mode === 'day' && (
          <div className="w-52">
            <Input type="date" value={day} min={isoDay(addDays(new Date(), -89))} max={isoDay(new Date())} onChange={(e) => e.target.value && setDay(e.target.value)} className="h-10" />
          </div>
        )}
        {mode === 'month' && (
          <div className="w-52">
            <Input
              type="month"
	              value={month}
              min={isoDay(new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)).slice(0, 7)}
              max={isoDay(new Date()).slice(0, 7)}
              onChange={(e) => e.target.value && setMonth(e.target.value)}	
              className="h-10"
            />
          </div>
        )}
        {mode === 'year' && <Badge tone="leaf">Seasonal view - low in winter, high in summer</Badge>}
      </div>

      {loading || !rows || !totals ? (
        <div className="space-y-5">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-5">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Stagger key={`${mode}-${dateKey}`} className="space-y-5">
          <div className="grid grid-cols-6 gap-3.5">  
            <Kpi icon={<Sun size={18} />} tone="bg-sun-100 text-amber-500" label="Generated" value={totals.generated} format={kwhFormat} sub={`${me.panelKwp} kWp system`} />
            <Kpi icon={<ArrowUpFromLine size={18} />} tone="bg-leaf-100 text-leaf-700" label="Exported (sold)" value={totals.exported} format={kwhFormat} sub={`Revenue ${eur(totals.revenue)}`} /> 
            <Kpi icon={<ArrowDownToLine size={18} />} tone="bg-sky-100 text-sky-500" label="Imported (bought)" value={totals.imported} format={kwhFormat} sub={`Cost ${eur(totals.cost)}`} />
            <Kpi
              icon={<PiggyBank size={18} />}
              tone={totals.net >= 0 ? 'bg-leaf-100 text-leaf-700' : 'bg-loss-100 text-loss'}
              label={totals.net >= 0 ? 'Net profit' : 'Net loss'}
              value={totals.net}
              format={(v) => signedEur(v)}
              sub={totals.net >= 0 ? 'Earned more than spent' : 'Cloudy period'}
            />
            <Kpi icon={<PieIcon size={18} />} tone="bg-sun-100 text-amber-500" label="Self-consumption" value={selfPct} format={(v) => `${v.toFixed(0)}%`} sub="of your own solar used at home" />
            <Kpi
              icon={<Leaf size={18} />}
              tone="bg-leaf-100 text-leaf-700"
              label="CO2 saved"
              value={totals.generated * CO2_KG_PER_KWH}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} t` : `${v.toFixed(1)} kg`)}
              sub={`${CO2_KG_PER_KWH} kg per clean kWh`}
              action={
                <button
                  type="button"
                  onClick={() => navigate(`/rewards?tab=share&co2=${Math.round(totals.generated * CO2_KG_PER_KWH)}`)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-leaf-500 px-2 py-1 text-[11px] font-black text-white dark:text-on-sun transition hover:bg-leaf-600"
                >
                  <Share2 size={11} /> Share
                </button>
              }
            />
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-5">
            <Card>
              <CardTitle
                icon={<Sun size={18} />}
                title="Generation vs consumption"
                subtitle={`kWh per ${unit.toLowerCase()}`}
								action={<Legend items={[{ label: 'Generated', color: SERIES.generated }, { label: 'Consumed', color: SERIES.consumed }]} />}
              />
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={rows} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gen-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES.generated} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={SERIES.generated} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="con-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES.consumed} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={SERIES.consumed} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={AXIS.grid} />
                  <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} interval={interval} />
                  <YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={48} />
                  <Tooltip  
                    cursor={{ stroke: 'var(--color-ink-muted)', strokeDasharray: '3 3' }}
                    content={tooltip([
                      { key: 'generated', label: 'Generated', color: SERIES.generated },
                      { key: 'consumed', label: 'Consumed', color: SERIES.consumed },	
	                    ])}
                  />
                  <Area type="monotone" dataKey="generated" stroke={SERIES.generated} strokeWidth={2} fill="url(#gen-fill)" activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="consumed" stroke={SERIES.consumed} strokeWidth={2} fill="url(#con-fill)" activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <CardTitle icon={<PieIcon size={18} />} title="Self-consumption" subtitle="Where your solar energy went" />
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Used at home', value: round(selfConsumed, 1), color: SERIES.generated },
                        { name: 'Sold to neighbours', value: round(totals.exported, 1), color: SERIES.exported },
                      ]}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="var(--color-surface)"
                      strokeWidth={2}
                    >
                      <Cell fill={SERIES.generated} />
                      <Cell fill={SERIES.exported} />
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        const p = payload?.[0]?.payload as { name: string; value: number; color: string } | undefined
                        if (!active || !p) return null
                        return <ChartTooltipCard title={p.name} rows={[{ label: 'Energy', value: kwh(p.value), color: p.color }]} />
                      }}   
                    />
                  </PieChart>
                </ResponsiveContainer> 
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-2xl font-black text-ink">{selfPct.toFixed(0)}%</p>
                    <p className="text-[11px] font-bold text-ink-muted">self-used</p>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-center">
                <Legend
                  items={[
                    { label: `Home ${kwhFormat(selfConsumed)}`, color: SERIES.generated },
                    { label: `Sold ${kwhFormat(totals.exported)}`, color: SERIES.exported },
                  ]}
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Card>
              <CardTitle
								icon={<BarChart3 size={18} />}
                title="Exported vs imported"
                subtitle="Energy sold to and bought from neighbours"
                action={<Legend items={[{ label: 'Exported', color: SERIES.exported }, { label: 'Imported', color: SERIES.imported }]} />}
							/>
              <ResponsiveContainer width="100%" height={220}>
	                <BarChart data={rows} margin={{ top: 6, right: 8, left: -10, bottom: 0 }} barGap={2} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke={AXIS.grid} />
                  <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} interval={interval} />
									<YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={48} />
                  <Tooltip
                    cursor={{ fill: 'rgba(246,201,69,0.12)' }}
                    content={tooltip([
                      { key: 'exported', label: 'Exported', color: SERIES.exported },
                      { key: 'imported', label: 'Imported', color: SERIES.imported },
                    ])}
                  />
                  <Bar dataKey="exported" fill={SERIES.exported} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="imported" fill={SERIES.imported} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <CardTitle
                icon={<PiggyBank size={18} />}
                title="Cumulative profit"
                subtitle={`Running net result over the ${mode === 'day' ? 'day' : mode === 'month' ? 'month' : 'year'}`}
                action={<p className={cn('text-xl font-black', totals.net >= 0 ? 'text-leaf-700' : 'text-loss')}>{signedEur(totals.net)}</p>}   
              />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={rows} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={AXIS.grid} />
                  <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} interval={interval} />
                  <YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => v.toFixed(1)} />
                  <ReferenceLine y={0} stroke="var(--color-ink-muted)" strokeDasharray="3 3" />
                  <Tooltip
                    cursor={{ stroke: 'var(--color-ink-muted)', strokeDasharray: '3 3' }}
                    content={tooltip([
                      { key: 'net', label: 'Net', color: SERIES.profit, money: true },
                      { key: 'cumulative', label: 'Cumulative', color: SERIES.profit, money: true },
                    ])}
                  />
                  <Line type="monotone" dataKey="cumulative" stroke={SERIES.profit} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>


          <div className="grid grid-cols-2 gap-5">
            <Card>
              <CardTitle
                icon={<TrendingUp size={18} />}
                title="Price achieved vs grid price"
                subtitle="EUR per kWh, last 12 months"
                action={<Legend items={[{ label: 'Your sale price', color: SERIES.exported }, { label: 'Grid price', color: SERIES.consumed, dashed: true }]} />}
              />
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={priceComparison} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={AXIS.grid} />
                  <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} />
									<YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => v.toFixed(2)} domain={[0.1, 'auto']} />
                  <Tooltip
                    cursor={{ stroke: 'var(--color-ink-muted)', strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      const p = payload?.[0]?.payload as (typeof priceComparison)[number] | undefined;
                      if (!active || !p) return null
                      return (
                        <ChartTooltipCard
                          title={p.label}
                          rows={[
                            { label: 'Your sale price', value: eur(p.achieved, 3), color: SERIES.exported },
                            { label: 'Grid price', value: eur(p.grid, 3), color: SERIES.consumed },
                          ]}
                        />
                      )


                    }}
                  />
                  <Line type="monotone" dataKey="grid" stroke={SERIES.consumed} strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  <Line type="monotone" dataKey="achieved" stroke={SERIES.exported} strokeWidth={2} dot={{ r: 3, fill: SERIES.exported }} activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <CardTitle icon={<Users size={18} />} title="Top 5 buyers" subtitle="Neighbours who bought the most of your energy" />
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={topBuyers} layout="vertical" margin={{ top: 0, right: 40, left: 6, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid horizontal={false} stroke={AXIS.grid} />
                  <XAxis type="number" tick={AXIS.tick} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...AXIS.tick, fill: 'var(--color-ink-soft)' }} axisLine={false} tickLine={false} width={96} />
                  <Tooltip
                    cursor={{ fill: 'rgba(246,201,69,0.12)' }}
                    content={({ active, payload }) => {
                      const p = payload?.[0]?.payload as (typeof topBuyers)[number] | undefined
                      if (!active || !p) return null
                      return <ChartTooltipCard title={p.name} rows={[{ label: 'Bought', value: kwh(p.kwh), color: SERIES.exported }, { label: 'Paid', value: eur(p.total) }]} />
                    }}
                  />
                  <Bar
                    dataKey="kwh"
                    fill={SERIES.exported}
                    radius={[0, 4, 4, 0]}
                    label={{ position: 'right', fill: 'var(--color-ink-soft)', fontSize: 11, fontWeight: 800, formatter: (v: unknown) => `${v} kWh` }}  
                    onClick={(d: unknown) => {
                      const id = (d as { id?: string }).id;
                      if (id) navigate(`/users/${id}`)
                    }}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <Card>
              <CardTitle icon={<Gauge size={18} />} title="Panel health" subtitle="Compared with the expected yield" />
              <p className="text-2xl font-black text-orange-500">Output is 6% below expected</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: 'Expected', value: 100, cls: 'bg-line' },
                  { label: 'Actual', value: 94, cls: 'bg-sun-400' },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between text-xs font-bold text-ink-soft">
											<span>{b.label}</span>
                      <span>{b.value}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-line-soft"> 
                      <motion.div className={cn('h-full rounded-full', b.cls)} initial={{ width: 0 }} animate={{ width: `${b.value}%` }} transition={{ duration: 1 }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-ink-muted">Tip: dust or pollen on the panels. A rinse usually restores 3-5%.</p>
            </Card>
            <Card>
              <CardTitle icon={<PiggyBank size={18} />} title="Savings vs grid" subtitle="Buying from neighbours instead of the grid" />
              <p className="text-3xl font-black text-leaf-700">
                <AnimatedNumber value={savings.saved} format={(v) => eur(v)} />
              </p>
              <p className="text-xs font-bold text-ink-muted">saved on {kwh(savings.kwh)} bought in 12 months</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">  
                <div className="rounded-xl bg-sun-50 p-2.5">
                  <p className="text-[11px] font-bold text-ink-muted">Grid would cost</p>
                  <p className="font-black text-ink">{eur(savings.atGrid)}</p>
                </div>
                <div className="rounded-xl bg-leaf-50 p-2.5">
                  <p className="text-[11px] font-bold text-ink-muted">You paid</p>
                  <p className="font-black text-leaf-700">{eur(savings.paid)}</p>
                </div>
							</div>
            </Card>
            <Card>
              <CardTitle icon={<Activity size={18} />} title="Recent trades" action={<Button size="sm" variant="ghost" onClick={() => navigate('/wallet')}>All</Button>} />
              <ul className="space-y-2">
                {recent.map((t) => {
                  const user = t.counterpartyId ? getUser(t.counterpartyId) : undefined
                  return (
                    <li key={t.id} className="flex items-center gap-2.5">
                      {user && <Avatar initials={user.initials} color={user.avatarColor} size={28} />}
                      <span className="min-w-0 flex-1"> 
                        <span className="block truncate text-xs font-extrabold text-ink">{t.counterpartyName}</span>
                        <span className="block text-[11px] font-bold text-ink-muted">
                          {t.type === 'sale' ? 'Sold' : 'Bought'} {kwh(t.kwh)} - {relativeTime(t.date)}
                        </span>
                      </span>
                      <span className={cn('text-xs font-black', t.type === 'sale' ? 'text-leaf-700' : 'text-ink')}>{signedEur(t.type === 'sale' ? t.total : -t.total)}</span>
                    </li>
									);
                })}
              </ul>
            </Card>
          </div>

          <Card>
            <CardTitle icon={<FileText size={18} />} title="Breakdown" subtitle={`Per ${unit.toLowerCase()} - profit in green, loss in red`} />
            <div className="max-h-[440px] overflow-y-auto rounded-xl border border-line-soft">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-sun-50">
                  <tr className="text-right text-[11px] font-black tracking-wider text-ink-muted uppercase">
                    <th className="py-2.5 pl-4 text-left">{unit}</th>
                    <th>Generated</th>
                    <th>Exported</th>
                    <th>Imported</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th className="pr-4">Net result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t border-line-soft text-right font-semibold text-ink-soft tabular-nums hover:bg-sun-50/60">
                      <td className="py-2 pl-4 text-left font-bold text-ink"> 
                        {mode === 'day' ? r.label : mode === 'month' ? new Date(r.key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : new Date(r.key).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                      </td> 
                      <td>{r.generated.toFixed(2)} kWh</td>
                      <td>{r.exported.toFixed(2)} kWh</td>
                      <td>{r.imported.toFixed(2)} kWh</td>
                      <td>{eur(r.revenue)}</td>
                      <td>{eur(r.cost)}</td>
	                      <td className={cn('pr-4 font-black', r.net > 0.004 ? 'text-leaf-700' : r.net < -0.004 ? 'text-loss' : 'text-ink-muted')}>{signedEur(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-sun-100">
                  <tr className="text-right font-black text-ink tabular-nums">
                    <td className="py-2.5 pl-4 text-left">Total</td>
                    <td>{totals.generated.toFixed(1)} kWh</td>
                    <td>{totals.exported.toFixed(1)} kWh</td>
                    <td>{totals.imported.toFixed(1)} kWh</td>	
                    <td>{eur(totals.revenue)}</td>
                    <td>{eur(totals.cost)}</td>
                    <td className={cn('pr-4', totals.net >= 0 ? 'text-leaf-700' : 'text-loss')}>{signedEur(totals.net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-2 text-xs font-semibold text-ink-muted">Data range: {mode === 'day' ? `last 90 days (from ${dateShort(isoDay(addDays(new Date(), -89)))})` : 'last 12 months'}.</p>
          </Card>
        </Stagger>
      )}
    </div>
  );
}
