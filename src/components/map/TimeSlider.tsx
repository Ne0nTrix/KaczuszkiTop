import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { CLOCK_MAX, CLOCK_MIN, DEMO_DAY_LABEL } from '../../data/constants'
import { cn } from '../../lib/cn'
import { useMarket } from '../../state/MarketProvider';

const W = 280;
const H = 58;



export function TimeSlider() {
  const { simHour, setHour, playing, togglePlay, speed, setSpeed } = useMarket();
  const t = (simHour - CLOCK_MIN) / (CLOCK_MAX - CLOCK_MIN);
  const sunX = 14 + t * (W - 28);
  const sunY = H - 8 - Math.sin(Math.PI * t) * (H - 22);
  const night = simHour <= 5 || simHour >= 21
  const pct = t * 100

	return (
    <div className="pointer-events-auto w-[440px] rounded-2xl border border-line bg-surface/95 px-4 pt-2.5 pb-3 shadow-lift backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <p className="text-[22px] leading-none font-black text-ink tabular-nums">
            {String(simHour).padStart(2, '0')}:00 <span className="text-xs font-extrabold text-ink-muted">CET</span>
          </p>
					<p className="mt-1 text-[11px] font-bold whitespace-nowrap text-ink-muted">{DEMO_DAY_LABEL}</p>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[58px] flex-1" aria-hidden="true">
          <path d={`M 14 ${H - 8} Q ${W / 2} ${-H + 30} ${W - 14} ${H - 8}`} fill="none" stroke="var(--color-line)" strokeWidth="2" strokeDasharray="4 5" />
          <line x1="4" x2={W - 4} y1={H - 8} y2={H - 8} stroke="var(--color-line)" strokeWidth="1.5" />
          <motion.g animate={{ x: sunX, y: sunY }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
            <circle r="13" fill={night ? '#9BA7C9' : '#F6C945'} opacity="0.25" />	
            <circle r="8" fill={night ? '#C9D1E8' : '#F6C945'} stroke={night ? '#8C96B8' : '#F4A300'} strokeWidth="1.5" />
          </motion.g>   
        </svg>
      </div>
      <div className="mt-1.5 flex items-center gap-2.5">
				<motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={togglePlay}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-sun-400 text-on-sun shadow-soft transition hover:bg-sun-300"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </motion.button>
        <div className="relative flex-1">
					<input
            type="range"
            min={CLOCK_MIN}
            max={CLOCK_MAX}
            step={1}
            value={simHour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(90deg, #F4A300 0%, #F6C945 ${pct}%, var(--color-line-soft) ${pct}%)` }}
            aria-label="Time of day"
          />
          <div className="mt-0.5 flex justify-between text-[10px] font-bold text-ink-muted">
            <span>05:00</span>
            <span>13:00</span> 
	            <span>21:00</span>
          </div>
        </div>
        <div className="flex rounded-xl border border-line p-0.5">
          {([1, 2] as const).map((s) => (
						<button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn('cursor-pointer rounded-lg px-2 py-1 text-xs font-black transition', speed === s ? 'bg-sun-400 text-on-sun' : 'text-ink-muted hover:text-ink')}
						>
              {s}x
						</button>
          ))}
        </div>
      </div>
    </div>
	  );
}

export function DayTint() {
  const { simHour } = useMarket()
  const color =
    simHour <= 5
			? 'rgba(90, 100, 170, 0.22)'
      : simHour <= 7
        ? 'rgba(255, 160, 100, 0.16)'
        : simHour <= 16
          ? 'rgba(255, 214, 120, 0.09)'
          : simHour <= 19
            ? 'rgba(255, 185, 60, 0.15)'
            : 'rgba(70, 90, 170, 0.22)';
  return <div className="pointer-events-none absolute inset-0 z-[450] mix-blend-multiply transition-colors duration-700 dark:mix-blend-normal dark:opacity-60" style={{ background: color }} />
}
