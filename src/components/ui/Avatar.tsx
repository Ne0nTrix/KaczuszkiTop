import { cn } from '../../lib/cn'
	
interface AvatarProps {
  initials: string
  color: string
  size?: number
  className?: string
  ring?: boolean
}


export function Avatar({ initials, color, size = 40, className, ring }: AvatarProps) {
  return ( 
    <span
      className={cn(	
        'inline-grid shrink-0 place-items-center rounded-full font-extrabold text-white select-none',
        ring && 'ring-2 ring-surface ring-offset-2 ring-offset-sun-200',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
        background: `linear-gradient(140deg, ${color}, color-mix(in srgb, ${color} 70%, #2B2A1F))`,
        textShadow: '0 1px 2px rgba(0,0,0,0.18)',
      }}
    >
      {initials}
    </span>
  );
}
