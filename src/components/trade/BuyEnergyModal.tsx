import { Leaf, MapPin, ShoppingBasket } from 'lucide-react';
import { useEffect, useState } from 'react'
	import type { User } from '../../types';
import { CO2_KG_PER_KWH } from '../../data/constants';
import { distanceKm } from '../../lib/geo'
import { eur, km, kwh } from '../../lib/format'
import { useApp } from '../../state/AppStateProvider';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Field'
import { Modal } from '../ui/Modal';

export function BuyEnergyModal({ seller, open, onClose }: { seller: User | null; open: boolean; onClose: () => void }) {
  const { me, buyEnergy, discountPct } = useApp();
  const max = Math.max(1, Math.floor((seller?.surplusKwh ?? 1) * 2) / 2);
  const [amount, setAmount] = useState(Math.min(5, max));

  useEffect(() => {
    if (open) setAmount(Math.min(5, max))
  }, [open, max])

  if (!seller) return null;
  const price = seller.pricePerKwh * (1 - discountPct / 100);
  const total = amount * price;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buy energy"
      subtitle={`Directly from ${seller.name}`}
      icon={<ShoppingBasket size={20} />}
      footer={
        <>   
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="secondary"
						onClick={() => {
              buyEnergy(seller.id, amount);
              onClose();
    
            }}
          >
            Confirm purchase - {eur(total)}
          </Button>
        </>
      }	
    >
      <div className="flex items-center gap-3 rounded-2xl bg-sun-50 p-3">
        <Avatar initials={seller.initials} color={seller.avatarColor} size={44} />
        <div className="flex-1">
          <p className="font-extrabold text-ink">{seller.name}</p>
          <p className="flex items-center gap-1 text-xs font-bold text-ink-muted">
            <MapPin size={12} /> {seller.city} - {km(distanceKm(me, seller))} away
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-ink-muted">Available</p>
          <p className="font-black text-leaf-700">{kwh(seller.surplusKwh)}</p>
        </div>
      </div>
      <div className="mt-5">	
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-bold text-ink-soft">Amount</span>
          <span className="text-2xl font-black text-ink">{kwh(amount)}</span>
        </div>
        <Slider value={amount} min={0.5} max={max} step={0.5} onChange={setAmount} />
      </div>
      <div className="mt-5 space-y-2 rounded-2xl border border-line p-4 text-sm">  
        <div className="flex justify-between font-semibold text-ink-soft">
          <span>Price per kWh</span>
          <span className="font-bold text-ink">
            {discountPct > 0 && <span className="mr-1.5 text-ink-muted line-through">{eur(seller.pricePerKwh)}</span>}
            {eur(price, 3)}
          </span>
        </div>
        {discountPct > 0 && (
          <div className="flex justify-between font-semibold text-leaf-600">
            <span>EcoToken discount</span>
            <span>-{discountPct}%</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line-soft pt-2 text-base font-black text-ink"> 
          <span>Total</span>
          <span>{eur(total)}</span>
        </div>	
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-leaf-700">
        <Leaf size={16} /> Saves {(amount * CO2_KG_PER_KWH).toFixed(1)} kg of CO2 compared to the grid mix.
      </p>
    </Modal>
  )
} 
