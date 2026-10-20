import { HandCoins } from 'lucide-react'
import { useEffect, useState } from 'react';
import type { Offer, User } from '../../types'
import { eur, kwh } from '../../lib/format'
import { Button } from '../ui/Button';
import { Slider } from '../ui/Field'
import { Modal } from '../ui/Modal'

interface CounterOfferModalProps {
	offer: Offer | null
	seller: User | undefined
  onClose: () => void
  onSubmit: (price: number) => void
}

export function CounterOfferModal({ offer, seller, onClose, onSubmit }: CounterOfferModalProps) {
  const [price, setPrice] = useState(0.18)


  useEffect(() => {
    if (offer) setPrice(Math.round((offer.pricePerKwh - 0.02) * 100) / 100)
  }, [offer]);

  if (!offer) return null
  const diff = ((price - offer.pricePerKwh) / offer.pricePerKwh) * 100

	return (
    <Modal
			open={!!offer}
      onClose={onClose}
      title="Counter offer"
      subtitle={`${kwh(offer.kwh)} from ${seller?.name ?? 'a neighbour'} at ${eur(offer.pricePerKwh)} / kWh`}
			icon={<HandCoins size={20} />}
      footer={
        <>
					<Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSubmit(price)}>Send counter offer</Button>
        </>
      }
		>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-sm font-bold text-ink-soft">Your price per kWh</span>
        <span className="text-3xl font-black text-ink">{eur(price)}</span>
      </div>
      <Slider value={price} min={0.1} max={offer.pricePerKwh} step={0.01} onChange={(v) => setPrice(Math.round(v * 100) / 100)} />
			<div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-sun-50 p-3">
					<p className="text-xs font-bold text-ink-muted">Difference</p>
					<p className="text-lg font-black text-ink">{diff.toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl bg-leaf-50 p-3">
          <p className="text-xs font-bold text-ink-muted">You would pay</p>
					<p className="text-lg font-black text-leaf-700">{eur(price * offer.kwh)}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-ink-muted">Tip: offers within 15% of the asking price are usually accepted.</p>
		</Modal>
  )
}
