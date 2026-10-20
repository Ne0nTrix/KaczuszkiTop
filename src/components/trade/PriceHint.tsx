import { motion } from 'framer-motion'
import { Lightbulb } from "lucide-react"
import { eur } from '../../lib/format'
import { suggestedRange, useMarket } from '../../state/MarketProvider'

export function PriceHint({ price }: { price: number }) {
  const { currentPrice } = useMarket()
  const [low, high] = suggestedRange(currentPrice)
  const status = price > currentPrice ? 'above' : price > high ? 'high' : price < low ? 'low' : 'good'
  const tone = {
    above: 'bg-orange-100 text-orange-500 border-orange-100',
    high: 'bg-sun-100 text-sun-700 border-sun-300',
    low: 'bg-sky-100 text-sky-500 border-sky-100',
    good: 'bg-leaf-100 text-leaf-700 border-leaf-200',
  }[status]
  const note = {
    above: 'Above the grid price - buyers will likely skip it.',
    high: 'A bit high - it may sell slower.',
    low: 'Below the suggested range - it will sell fast.',
    good: 'Great price - likely to sell quickly!',
  }[status]

  return (
    <motion.div layout className={`rounded-2xl border px-3.5 py-2.5 ${tone}`}>
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <Lightbulb size={15} />
        Grid price {eur(currentPrice)} - suggested {eur(low)}-{eur(high)}
      </p>
      <p className="mt-0.5 text-xs font-bold opacity-85">{note}</p>
    </motion.div>
  )
}
