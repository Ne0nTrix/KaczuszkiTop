import { Download, Leaf, Link2, Share2, Sun, TreePine, Wallet, Zap } from 'lucide-react'
import { useMemo, useState } from "react"
import { downloadSvgAsPng } from '../../lib/exportPng'
import { useApp } from "../../state/AppStateProvider"
import { useToast } from '../../state/ToastProvider'
import { Button } from '../ui/Button'
import { Card, CardTitle } from '../ui/Card'
import { Segmented } from "../ui/Segmented"
import { SHARE_H, SHARE_W, shareCardSvg } from "./shareCardSvg"
import type { ShareStyle, ShareVariant } from "./shareCardSvg"

export interface ShareValues {
  co2Kg: number
  kwhSold: number
  trees: number
  money: number
}

export function SharePanel({ values, initial = 'co2' }: { values: ShareValues; initial?: ShareVariant }) {
  const { me } = useApp()
	const { toast } = useToast()
  const [variant, setVariant] = useState<ShareVariant>(initial)
  const [style, setStyle] = useState<ShareStyle>('light')
  const [busy, setBusy] = useState(false)  

  const value = {
    co2: `${Math.round(values.co2Kg)} kg`,
    kwh: `${Math.round(values.kwhSold)} kWh`,
    trees: `${Math.round(values.trees)}`,
    money: `EUR ${values.money.toFixed(0)}`,
  }[variant]

  const svg = useMemo(
    () => shareCardSvg({ variant, style, value, name: me.name, initials: me.initials, city: `${me.city}, ${me.country}` }),
    [variant, style, value, me.name, me.initials, me.city, me.country],
  )
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`   

  const download = async () => {
    setBusy(true)
    try {
      await downloadSvgAsPng(svg, SHARE_W, SHARE_H, `sunswap-${variant}.png`)
      toast('Image downloaded', 'Your 1200x630 share card is ready to post.')
    } catch {
      toast('Download failed', 'Please try again.', 'warning')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-[1fr_300px] gap-5">
      <Card>
        <CardTitle icon={<Share2 size={18} />} title="Share your impact" subtitle="1200 x 630 card, perfect for social media" />
        <div className="overflow-hidden rounded-2xl border border-line shadow-lift">
          <img src={src} alt="Share card preview" className="block w-full" width={SHARE_W} height={SHARE_H} />
        </div>
      </Card>
      <Card className="space-y-5">	
        <div>
          <p className="mb-2 text-xs font-extrabold tracking-wide text-ink-muted uppercase">Variant</p>
          <div className="grid grid-cols-2 gap-2">	
            {(
              [
                ['co2', 'CO2 saved', Leaf],
                ['kwh', 'kWh sold', Zap],
                ['trees', 'Trees planted', TreePine],
                ['money', 'Money earned', Wallet],
              ] as const   
            ).map(([key, label, Icon]) => ( 
              <button
                key={key}
                type="button"
                onClick={() => setVariant(key)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${variant === key ? 'border-leaf-500 bg-leaf-50 text-leaf-700' : 'border-line text-ink-soft hover:bg-sun-50'}`}
              > 
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>
				<div>
          <p className="mb-2 text-xs font-extrabold tracking-wide text-ink-muted uppercase">Style</p>
          <Segmented
            layoutId="share-style"
            value={style}
            onChange={setStyle}
						options={[
              { value: 'light', label: 'Light', icon: <Sun size={14} /> },	
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>
        <div className="space-y-2">   
          <Button size="lg" className="w-full" icon={<Download size={18} />} onClick={download} disabled={busy}>
            {busy ? 'Rendering...' : 'Download image'}
					</Button>
          <Button
            variant="outline"
            className="w-full"
            icon={<Link2 size={16} />}
            onClick={() => {
              navigator.clipboard?.writeText(`https://sunswap.app/s/${me.initials.toLowerCase()}-${variant}`).catch(() => undefined)
              toast('Link copied', 'Share it anywhere - it opens your impact card.', 'info')   
            }}
          >
            Copy link
          </Button>
					<Button variant="secondary" className="w-full" icon={<Share2 size={16} />} onClick={() => toast('Shared!', 'Your card was posted to your feed (simulated).')}>
            Share
          </Button>
        </div>
      </Card>
    </div>
  )
    
}
