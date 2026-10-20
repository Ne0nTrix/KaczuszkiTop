import { motion } from 'framer-motion';
import { Award, Blocks, ChevronRight, FileCheck2, Leaf, Search, ShieldCheck, Zap } from 'lucide-react';	
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LedgerView } from '../components/certificates/LedgerView';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, Stagger } from '../components/ui/Card';  
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Segmented';
import { PageSkeleton } from '../components/ui/Skeleton'
import { CO2_KG_PER_KWH } from '../data/constants';
import { COUNTRIES } from '../data/countries';
import { Select } from '../components/ui/Field';
import { dateLong } from '../lib/format';
import { usePageLoading } from '../lib/useFakeQuery';
import { useLedger } from '../lib/useLedger';
import { useApp } from '../state/AppStateProvider';

type Tab = 'registry' | 'ledger'

export function CertificatesPage() { 
  const { world } = useApp()
  const loading = usePageLoading();
  const navigate = useNavigate();	
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'registry'
  const [query, setQuery] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [country, setCountry] = useState('all')
  const blocks = useLedger(world.ledgerEntries)

	const certificates = useMemo(
    () =>	
      [...world.certificates]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((c) => !mineOnly || c.sellerId === 'me' || c.buyerId === 'me')
        .filter((c) => country === 'all' || c.sellerCountry === country || c.buyerCountry === country)
        .filter((c) => {
          const q = query.trim().toLowerCase();
          return !q || [c.id, c.sellerName, c.buyerName, c.sellerCity, c.buyerCity].some((v) => v.toLowerCase().includes(q))
        }),
    [world.certificates, mineOnly, query, country],
  );

  const totalKwh = world.certificates.reduce((s, c) => s + c.kwh, 0)
  const mine = world.certificates.filter((c) => c.sellerId === 'me' || c.buyerId === 'me').length;

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader
        icon={<Award size={24} />}
        title="Renewable energy certificates"
        subtitle="Every traded kWh gets a tamper-proof certificate of solar origin - backed by a 120-block hash chain"
        actions={
          <Button variant="outline" icon={<ShieldCheck size={16} />} onClick={() => navigate('/verify')}>
            Public verification
          </Button>
        }
      />
      <Stagger className="space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <FileCheck2 size={19} />, label: 'Certificates issued', value: world.certificates.length, format: (v: number) => v.toFixed(0), tone: 'bg-sun-100 text-amber-500' },
            { icon: <Zap size={19} />, label: 'kWh certified', value: totalKwh, format: (v: number) => `${v.toFixed(1)} kWh`, tone: 'bg-leaf-100 text-leaf-700' },
            { icon: <Leaf size={19} />, label: 'CO2 avoided', value: totalKwh * CO2_KG_PER_KWH, format: (v: number) => `${v.toFixed(0)} kg`, tone: 'bg-leaf-100 text-leaf-700' },
            { icon: <Blocks size={19} />, label: 'Ledger blocks', value: world.ledgerEntries.length, format: (v: number) => v.toFixed(0), tone: 'bg-sky-100 text-sky-500' },
          ].map((k) => (
            <Card key={k.label} className="flex items-center gap-4">
              <span className={`grid size-11 place-items-center rounded-xl ${k.tone}`}>{k.icon}</span>
              <div>
                <p className="text-xs font-extrabold tracking-wide text-ink-muted uppercase">{k.label}</p>
                <p className="text-2xl font-black text-ink">
                  <AnimatedNumber value={k.value} format={k.format} />
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <Segmented
              layoutId="cert-tabs"
              value={tab}
              onChange={(v) => setParams(v === 'registry' ? {} : { tab: v })}
              options={[
                { value: 'registry', label: 'Registry', icon: <FileCheck2 size={15} /> },
                { value: 'ledger', label: 'Hash-chained ledger', icon: <Blocks size={15} /> },
              ]}
            />
            {tab === 'registry' && (
              <div className="flex items-center gap-3">
                <div className="w-44 shrink-0">
                  <Select value={country} onChange={(e) => setCountry(e.target.value)} className="h-9 text-xs" aria-label="Country">
                    <option value="all">All countries</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}

                      </option>
                    ))}
                  </Select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink-soft">
                  <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="size-4 accent-leaf-500" />
                  Only mine
                </label>
                <div className="relative">
                  <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ID, name or city"
                    className="h-9 w-64 rounded-xl border border-line bg-surface pr-3 pl-9 text-sm font-semibold outline-none focus:border-sun-400"
                  />
                </div>
              </div>
            )}
          </div>

          {tab === 'ledger' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="mb-4 max-w-3xl text-sm text-ink-soft">
                Every smart contract and certificate ({mine} of them yours) is written into a block whose hash depends on the previous block. Changing any past record breaks every link after it -
                try <b>Simulate tampering</b> and then <b>Verify chain</b>.
              </p>
              <LedgerView blocks={blocks} />
            </motion.div>
          ) : certificates.length === 0 ? (
            <EmptyState title="No certificates found" text="Try a different search term." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-black tracking-wider text-ink-muted uppercase">
                  <th className="py-2.5 pl-2">Certificate ID</th>
                  <th>Date</th>
                  <th>Source</th>
                  <th className="text-right">Amount</th>
                  <th className="pl-6">Seller</th>
                  <th>Buyer</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {certificates.map((c, i) => (
                  <motion.tr
                    key={c.id}  
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 15) * 0.02 }}
                    onClick={() => navigate(`/certificates/${c.id}`)}
                    className="group cursor-pointer border-b border-line-soft last:border-0 hover:bg-sun-50"
                  >
                    <td className="py-3 pl-2 font-mono text-[13px] font-bold text-ink">{c.id}</td>
                    <td className="font-semibold text-ink-soft">{dateLong(c.date)}</td>
                    <td>
                      <Badge tone="sun">PV solar</Badge>
                    </td>
                    <td className="text-right font-black whitespace-nowrap text-leaf-700 tabular-nums">{c.kwh.toFixed(1)} kWh</td>
                    <td className="pl-6 font-bold text-ink">
                      {c.sellerName} {c.sellerId === 'me' && <Badge tone="leaf" className="ml-1">You</Badge>}
                      <span className="block text-xs font-semibold text-ink-muted">
                        {c.sellerCity}, <b>{c.sellerCountry}</b>
                      </span>
                    </td>
                    <td className="font-bold text-ink">
                      {c.buyerName} {c.buyerId === 'me' && <Badge tone="leaf" className="ml-1">You</Badge>}
                      <span className="block text-xs font-semibold text-ink-muted">
                        {c.buyerCity}, <b>{c.buyerCountry}</b>
                      </span>
                    </td>
                    <td className="pr-2 text-right text-ink-muted transition group-hover:translate-x-1 group-hover:text-ink">
                      <ChevronRight size={18} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </Stagger>
    </div>
  );
}
