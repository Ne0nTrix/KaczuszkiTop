import { AnimatePresence, motion } from 'framer-motion'
import { Clock, MessageCircle, Moon, RefreshCw, Tag, WandSparkles, X } from 'lucide-react'
import { useState } from 'react';
import { useApp } from '../../state/AppStateProvider';
import { useMarket } from '../../state/MarketProvider';
import { useTheme } from '../../state/ThemeProvider'
import { useToast } from '../../state/ToastProvider'

export function DemoControls() {
  const [open, setOpen] = useState(false);


  const { regenerate, simulateIncomingOffer, simulateIncomingMessage } = useApp()
  const { toggleTheme } = useTheme()
  const { toast } = useToast();
  const { advanceHour, simHour } = useMarket();   

  const items = [
    { label: 'Regenerate data', icon: RefreshCw, run: regenerate },
    { label: 'Simulate incoming offer', icon: Tag, run: simulateIncomingOffer },
    { label: 'Simulate new message', icon: MessageCircle, run: simulateIncomingMessage },
    {
      label: 'Advance one hour',
      icon: Clock,
      run: () => {
        advanceHour();
        toast(`It is now ${String(simHour >= 21 ? 5 : simHour + 1).padStart(2, '0')}:00`, 'Surplus and prices updated across the map.', 'info');
      },
    },
    { label: 'Toggle dark mode', icon: Moon, run: toggleTheme },
  ];

  return (
    <div className="no-print fixed bottom-4 left-[244px] z-[1000]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 w-60 rounded-2xl border border-line bg-surface/95 p-2 shadow-lift backdrop-blur"
					>
            <div className="flex items-center justify-between px-2 pt-1 pb-2">
              <p className="text-[11px] font-black tracking-wider text-ink-muted uppercase">Demo controls</p>
              <span className="rounded-md bg-sun-100 px-1.5 text-[11px] font-black text-ink-soft">{String(simHour).padStart(2, '0')}:00</span>
            </div>
            {items.map(({ label, icon: Icon, run }) => (
              <motion.button
                key={label}
                type="button"  
                whileTap={{ scale: 0.96 }}
                onClick={run}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-bold text-ink-soft transition hover:bg-sun-100 hover:text-ink"
              >   
                <Icon size={15} className="text-leaf-600" />
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
			<motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 cursor-pointer place-items-center rounded-full border border-line bg-surface/80 text-ink-muted opacity-60 shadow-soft backdrop-blur transition hover:text-leaf-700 hover:opacity-100"
        title="Demo controls"
      >
        {open ? <X size={17} /> : <WandSparkles size={17} />}
      </motion.button>
    </div>
  );
}
