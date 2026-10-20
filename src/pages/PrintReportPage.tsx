import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LogoMark } from '../components/layout/Logo'
import { CO2_KG_PER_KWH } from '../data/constants'
import { totalsOf } from '../data/energy'
import { cn } from '../lib/cn'
import { eur, isoDay, signedEur } from '../lib/format'
import { useApp } from '../state/AppStateProvider'
import { loadStats, periodLabel } from './DashboardPage'
import type { StatsMode } from './DashboardPage'
import { PrintLayout } from './PrintLayout'
  
export function PrintReportPage() {
  const [params] = useSearchParams()
  const { me, world } = useApp() 
  const raw = params.get('mode')
    
  const mode: StatsMode = raw === 'day' || raw === 'year' ? raw : 'month'
  const dateKey = params.get('date') ?? isoDay(new Date())
  const rows = useMemo(() => loadStats(mode, dateKey, me.panelKwp, world.seed), [mode, dateKey, me.panelKwp, world.seed])
  const totals = totalsOf(rows)

  return (
    <PrintLayout>
      <div className="print-sheet rounded-2xl bg-surface p-10 shadow-lift">
        <div className="flex items-start justify-between border-b-2 border-sun-400 pb-5">
          <div className="flex items-center gap-3">
            <LogoMark size={46} />
            <div>
              <p className="text-xl font-black text-ink">
                Sun<span className="text-leaf-500">Swap</span> {mode === 'month' ? 'monthly' : mode === 'year' ? 'yearly' : 'daily'} energy report
              </p>
              <p className="text-sm font-bold text-ink-muted">{periodLabel(mode, dateKey)}</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-extrabold text-ink">{me.name}</p>
            <p className="text-ink-muted">
              {me.city}, {me.country} - {me.panelKwp} kWp PV
            </p>
            <p className="text-ink-muted">Generated {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>



        <div className="mt-6 grid grid-cols-5 gap-3">  
          {[
            ['Generated', `${totals.generated.toFixed(1)} kWh`],
            ['Exported', `${totals.exported.toFixed(1)} kWh`],
            ['Imported', `${totals.imported.toFixed(1)} kWh`],
            ['Net result', signedEur(totals.net)],   
            ['CO2 saved', `${(totals.generated * CO2_KG_PER_KWH).toFixed(1)} kg`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-line bg-sun-50 p-3">
              <p className="text-[10px] font-extrabold tracking-wider text-ink-muted uppercase">{label}</p>
              <p className="text-lg font-black text-ink">{value}</p>
            </div>
          ))}
        </div>

        <table className="mt-6 w-full text-[12px]">
          <thead>
            <tr className="border-b-2 border-line text-right text-[10px] font-black tracking-wider text-ink-muted uppercase">
              <th className="py-2 text-left">{mode === 'day' ? 'Hour' : mode === 'year' ? 'Month' : 'Day'}</th>
              <th>Generated</th>
              <th>Consumed</th>
              <th>Exported</th> 
              <th>Imported</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-line-soft text-right tabular-nums">
                <td className="py-1 text-left font-bold">{mode === 'month' ? r.key : r.label}</td>
                <td>{r.generated.toFixed(2)}</td>
                <td>{r.consumed.toFixed(2)}</td>
                <td>{r.exported.toFixed(2)}</td>
                <td>{r.imported.toFixed(2)}</td>
                <td>{eur(r.revenue)}</td>
                <td>{eur(r.cost)}</td>
                <td className={cn('font-bold', r.net >= 0 ? 'text-leaf-700' : 'text-loss')}>{signedEur(r.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line text-right font-black tabular-nums">
              <td className="py-2 text-left">Total</td>
              <td>{totals.generated.toFixed(1)}</td>
              <td>{totals.consumed.toFixed(1)}</td>
              <td>{totals.exported.toFixed(1)}</td>
              <td>{totals.imported.toFixed(1)}</td>
              <td>{eur(totals.revenue)}</td>
              <td>{eur(totals.cost)}</td>
              <td className={totals.net >= 0 ? 'text-leaf-700' : 'text-loss'}>{signedEur(totals.net)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-6 text-center text-xs font-semibold text-ink-muted">
          Energy amounts in kWh, prices in EUR. Trade your surplus sun with your neighbours - sunswap.app
        </p>
      </div>
    </PrintLayout>
  )
}
