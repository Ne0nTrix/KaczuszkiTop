import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Award, ChevronLeft, ChevronRight, Coins, Download, FileSignature, Gift, Plus, Search, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Transaction, TransactionType } from "../types";
import { AXIS, ChartTooltipCard, SERIES } from '../components/charts/chartTheme'
	import { AnimatedNumber } from '../components/ui/AnimatedNumber';
	import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button';
import { Card, CardTitle, Stagger } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented'
import { PageSkeleton } from '../components/ui/Skeleton';

import { levelFor } from '../data/rewards';
import { cn } from '../lib/cn';
import { downloadCsv } from '../lib/csv';
import { dateTime, eur, kwh, num, signedEur } from '../lib/format';
import { round } from '../lib/random';
import { usePageLoading } from '../lib/useFakeQuery';


import { useApp } from '../state/AppStateProvider'
import { useToast } from '../state/ToastProvider';



type Filter = 'all' | 'income' | 'spending' | 'rewards'

const PAGE_SIZE = 15;

const isIncome = (t: Transaction) => t.type === 'sale' || t.type === 'reward'
const signed = (t: Transaction) => (isIncome(t) ? t.total : -t.total)

const TYPE_LABEL: Record<TransactionType, string> = { sale: 'Sale', purchase: 'Purchase', reward: 'Reward', redeem: 'Redeem' };

export function WalletPage() {
  const { world, getUser } = useApp()
  const { toast } = useToast();
  const navigate = useNavigate();
  const loading = usePageLoading();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const thisMonth = world.transactions.filter((t) => t.date >= monthStart && t.status === 'completed');
  const income = round(thisMonth.filter(isIncome).reduce((s, t) => s + t.total, 0), 2);
  const spending = round(thisMonth.filter((t) => !isIncome(t)).reduce((s, t) => s + t.total, 0), 2);

  const history = useMemo(() => {
    const now = new Date()
    let balance = world.balance;
    const points: Array<{ month: string; label: string; balance: number; income: number; spending: number }> = [];
    for(let back = 0; back < 12; back++) {
      const start = new Date(now.getFullYear(), now.getMonth() - back, 1);
    

      const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1);
      const inMonth = world.transactions.filter((t) => t.status === 'completed' && t.date >= start.toISOString() && t.date < end.toISOString());
      const monthIncome = inMonth.filter(isIncome).reduce((s, t) => s + t.total, 0);
			const monthSpending = inMonth.filter((t) => !isIncome(t)).reduce((s, t) => s + t.total, 0);
      points.unshift({
        month: start.toISOString(),
	        label: start.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), 
        balance: round(balance, 2),
        income: round(monthIncome, 2),
        spending: round(monthSpending, 2),
      });
      balance -= monthIncome - monthSpending;
    }
    return points;
  }, [world.balance, world.transactions]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return world.transactions.filter(
      (t) =>
        (filter === 'all' ||
          (filter === 'income' && t.type === 'sale') ||
	          (filter === 'spending' && (t.type === 'purchase' || t.type === 'redeem')) ||
          (filter === 'rewards' && t.type === 'reward')) &&
        (!q || t.counterpartyName.toLowerCase().includes(q) || (t.contractId ?? '').toLowerCase().includes(q) || t.country.toLowerCase() === q),
    );
  }, [world.transactions, filter, query])


  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const exportCsv = () => {
    downloadCsv(
      'sunswap-transactions.csv',
      ['Date', 'Type', 'Counterparty', 'Country', 'kWh', 'Price per kWh (EUR)', 'Total (EUR)', 'Status', 'Contract'],
      rows.map((t) => [t.date.slice(0, 16).replace('T', ' '), TYPE_LABEL[t.type], t.counterpartyName, t.country, t.kwh, t.pricePerKwh, signed(t).toFixed(2), t.status, t.contractId ?? '']),
    )
    toast('CSV exported', `${rows.length} transactions downloaded.`);

  };

  if(loading) return <PageSkeleton />
  const level = levelFor(world.ecoTokens);
  const yearIncome = history.reduce((s, p) => s + p.income, 0);

  return (   
    <div>
      <PageHeader
        icon={<Wallet size={24} />}
        title="Wallet"
        subtitle={`${world.transactions.length} transactions over the last 12 months`}
        actions={
          <>
            <Button variant="outline" icon={<Download size={16} />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => toast('Top-up simulated', 'This is a demo wallet - no real payments.', 'info')}>
              Top up
	            </Button>
          </>
        }
      />
      <Stagger className="space-y-5">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-4">
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#4c963b] via-[#5fae4b] to-[#8ccb6e] text-white">
            <motion.div className="absolute -right-10 -bottom-16 size-48 rounded-full bg-[#ffe07a]/40 blur-2xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity }} />
            <p className="relative text-xs font-extrabold tracking-wider text-white/80 uppercase">Available balance</p>
            <p className="relative mt-1 text-[40px] leading-none font-black tabular-nums">
              <AnimatedNumber value={world.balance} format={(v) => eur(v)} duration={1.6} />   
            </p>
            <p className="relative mt-3 text-sm font-bold text-white/85">{eur(yearIncome)} earned in the last 12 months</p>
          </Card>
          <Card>
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-ink-muted uppercase">   
              <ArrowDownLeft size={14} className="text-leaf-600" /> Income this month
            </p>
            <p className="mt-2 text-2xl font-black text-leaf-700">
              <AnimatedNumber value={income} format={(v) => `+${eur(v)}`} />
            </p>
            <p className="mt-1 text-xs font-bold text-ink-muted">{thisMonth.filter((t) => t.type === 'sale').length} sales</p>
          </Card>
          <Card>
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-ink-muted uppercase">
              <ArrowUpRight size={14} className="text-orange-500" /> Spending this month
            </p>
            <p className="mt-2 text-2xl font-black text-ink">
              <AnimatedNumber value={spending} format={(v) => `-${eur(v)}`} />
            </p>
            <p className="mt-1 text-xs font-bold text-ink-muted">{thisMonth.filter((t) => t.type === 'purchase').length} purchases</p>
          </Card>
          <Card className="cursor-pointer bg-gradient-to-br from-sun-100 to-surface transition hover:shadow-lift" onClick={() => navigate('/rewards')}>
            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-ink-muted uppercase">
              <Coins size={14} className="text-amber-500" /> EcoTokens
            </p>
            <p className="mt-2 text-2xl font-black text-ink">
							<AnimatedNumber value={world.ecoTokens} format={(v) => num(v)} />
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-leaf-700">
              <Award size={12} /> {level.name}
            </p>
          </Card>
        </div>

        <Card>
          <CardTitle icon={<Wallet size={18} />} title="Balance - last 12 months" subtitle="Month-end balance; hover for income and spending" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history} margin={{ top: 6, right: 8, left: -2, bottom: 0 }}>
              <defs>
                <linearGradient id="bal-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES.profit} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SERIES.profit} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={AXIS.grid} />
              <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} />
              <YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => v.toFixed(0)} domain={['auto', 'auto']} />
              <Tooltip
                cursor={{ stroke: 'var(--color-ink-muted)', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof history)[number] | undefined;
                  if(!active || !p) return null
                  return (
                    <ChartTooltipCard
                      title={p.label}
                      rows={[
                        { label: 'Balance', value: eur(p.balance), color: SERIES.profit },
	                        { label: 'Income', value: `+${eur(p.income)}` },
	                        { label: 'Spending', value: `-${eur(p.spending)}` },
                      ]}
                    /> 
                  );
                }}
              />
              <Area type="monotone" dataKey="balance" stroke={SERIES.profit} strokeWidth={2} fill="url(#bal-fill)" activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
	          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[15px] font-extrabold text-ink">Transaction history</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
                <input
	                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0)
                  }}
                  placeholder="Search name, contract, country"
                  className="h-9 w-64 rounded-xl border border-line bg-surface pr-3 pl-9 text-sm font-semibold text-ink outline-none focus:border-sun-400"
                />  
              </div>
              <Segmented
                size="sm"
                layoutId="wallet-filter"
                value={filter}
                onChange={(v) => {
                  setFilter(v);
                  setPage(0)
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'income', label: 'Sales' },
                  { value: 'spending', label: 'Purchases' },
                  { value: 'rewards', label: 'Rewards', icon: <Gift size={12} /> },
                ]}
              />
            </div>
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Nothing here" text="No transactions match your search." />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-black tracking-wider text-ink-muted uppercase">
                    <th className="py-2.5 pl-2">Date</th>
                    <th>Counterparty</th>
                    <th>Country</th>
                    <th>Type</th>
                    <th className="text-right">kWh</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                    <th className="pl-5">Status</th>
                    <th className="pr-2">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => {
                    const user = t.counterpartyId ? getUser(t.counterpartyId) : undefined
                    const fresh = Date.now() - new Date(t.date).getTime() < 15000;
                    return (  
                      <tr key={t.id} className={cn('border-b border-line-soft last:border-0 hover:bg-sun-50', fresh && 'flash-new')}>
                        <td className="py-2.5 pl-2 font-semibold whitespace-nowrap text-ink-soft">{dateTime(t.date)}</td>
                        <td>
                          <span className="flex items-center gap-2 font-bold text-ink">
                            {user ? (	
	                              <Avatar initials={user.initials} color={user.avatarColor} size={26} />
                            ) : (
                              <span className="grid size-[26px] place-items-center rounded-full bg-sun-100 text-amber-500">
                                <Gift size={13} />
                              </span>
                            )}
                            <span className="max-w-[180px] truncate">{t.counterpartyName}</span>
                          </span>
	                        </td>
                        <td>
                          <span className="rounded-md bg-sun-100 px-1.5 py-0.5 text-xs font-black text-ink-soft">{t.country}</span>
                        </td>
                        <td>
                          <Badge tone={t.type === 'sale' ? 'leaf' : t.type === 'purchase' ? 'sky' : 'sun'}>{TYPE_LABEL[t.type]}</Badge>
                        </td>
                        <td className="text-right font-semibold text-ink-soft tabular-nums">{t.kwh ? kwh(t.kwh) : '-'}</td>
                        <td className="text-right font-semibold text-ink-soft tabular-nums">{t.pricePerKwh ? eur(t.pricePerKwh) : '-'}</td>
                        <td className={cn('text-right font-black tabular-nums', isIncome(t) ? 'text-leaf-700' : 'text-ink')}>{signedEur(signed(t))}</td>
                        <td className="pl-5">
                          <Badge tone={t.status === 'completed' ? 'neutral' : 'orange'}>{t.status === 'completed' ? 'Completed' : 'Pending'}</Badge>
                        </td>
                        <td className="pr-2">
                          {t.contractId ? (
                            <button
                              type="button"
                              onClick={() => navigate(t.certificateId ? `/certificates/${t.certificateId}` : '/certificates?tab=ledger')}
                              className="flex cursor-pointer items-center gap-1 font-mono text-xs font-bold text-leaf-700 hover:underline"
                            >
                              <FileSignature size={12} /> {t.contractId}
                            </button>
                          ) : (
                            <span className="text-xs text-ink-muted">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>  
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-bold text-ink-muted">
                  Showing {current * PAGE_SIZE + 1}-{Math.min(rows.length, (current + 1) * PAGE_SIZE)} of {rows.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" icon={<ChevronLeft size={15} />} disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page" />
                  {Array.from({ length: pages }, (_, i) => i)
                    .filter((i) => i === 0 || i === pages - 1 || Math.abs(i - current) <= 1)
                    .map((i, idx, arr) => (
                      <span key={i} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== i - 1 && <span className="px-1 text-ink-muted">...</span>}
                        <button
                          type="button"
                          onClick={() => setPage(i)}
                          className={cn('h-8 min-w-8 cursor-pointer rounded-lg px-2 text-xs font-black transition', i === current ? 'bg-sun-400 text-on-sun' : 'text-ink-soft hover:bg-sun-100')}
                        >
                          {i + 1}
                        </button>
	                      </span>
                    ))}
                  <Button size="sm" variant="ghost" icon={<ChevronRight size={15} />} disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page" />
                </div>
              </div>
            </>
          )}
        </Card>
      </Stagger>
    </div>
  )
}   
