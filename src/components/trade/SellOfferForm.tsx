import { Plus, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addDays, isoDay } from '../../lib/format'
import { useApp } from '../../state/AppStateProvider'
import { Button } from '../ui/Button'
import { Field, Input, Select, Slider } from '../ui/Field'
import { PriceHint } from './PriceHint'

export interface SellPrefill {
  kwh?: number	
  date?: string
  fromHour?: number
  toHour?: number 
}

const HOURS = Array.from({ length: 24 }, (_, h) => h)



export function SellOfferForm({ prefill }: { prefill?: SellPrefill }) {
  const { me, createOffer } = useApp()
  const [amount, setAmount] = useState(prefill?.kwh ?? 6)
  const [price, setPrice] = useState(me.pricePerKwh)
  const [date, setDate] = useState(prefill?.date ?? isoDay(new Date()))
  const [fromHour, setFromHour] = useState(prefill?.fromHour ?? 12)
  const [toHour, setToHour] = useState(prefill?.toHour ?? 15)

  useEffect(() => {
    if (!prefill) return
    if(prefill.kwh) setAmount(prefill.kwh) 
    if (prefill.date) setDate(prefill.date)

    if(prefill.fromHour !== undefined) setFromHour(prefill.fromHour)
	    if(prefill.toHour !== undefined) setToHour(prefill.toHour)
  }, [prefill])

  const submit = () => {
    createOffer({ kwh: amount, pricePerKwh: price, date, fromHour, toHour: Math.max(toHour, fromHour + 1) })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <span className="text-xs font-extrabold tracking-wide text-ink-soft uppercase">Amount</span>
          <span className="text-2xl font-black text-ink">
            {amount.toFixed(1)} <span className="text-sm text-ink-muted">kWh</span>
          </span>
        </div>
        <Slider value={amount} min={0.5} max={18} step={0.5} onChange={setAmount} />
      </div>
      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <span className="text-xs font-extrabold tracking-wide text-ink-soft uppercase">Price per kWh</span>
          <span className="text-2xl font-black text-ink">
            EUR {price.toFixed(2)}
          </span>  
        </div>
        <Slider value={price} min={0.1} max={0.32} step={0.01} onChange={(v) => setPrice(Math.round(v * 100) / 100)} />
      </div>
      <PriceHint price={price} />
      <div className="grid grid-cols-3 gap-2.5">
        <Field label="Date">   
          <Input type="date" value={date} min={isoDay(new Date())} max={isoDay(addDays(new Date(), 14))} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="From">
          <Select value={fromHour} onChange={(e) => setFromHour(Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </Select>
        </Field>
        <Field label="To">
          <Select value={toHour} onChange={(e) => setToHour(Number(e.target.value))}>
            {HOURS.filter((h) => h > fromHour).map((h) => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
            ))}
          </Select>
        </Field>
      </div>
      <Button size="lg" className="w-full" icon={<Plus size={18} />} onClick={submit}>
        List sell offer
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink-muted">
        <Sun size={13} /> Total value: EUR {(amount * price).toFixed(2)} - listed to neighbours within 25 km first
      </p>
    </div>
  )
}
