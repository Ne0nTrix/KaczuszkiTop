import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'   

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sun-400 text-on-sun hover:bg-sun-300 shadow-soft',
  secondary: 'bg-leaf-500 text-white dark:text-on-sun hover:bg-leaf-600 shadow-soft',
  ghost: 'bg-transparent text-ink-soft hover:bg-sun-100 hover:text-ink',
  outline: 'bg-surface text-ink border border-line hover:border-sun-400 hover:bg-sun-50',
  danger: 'bg-surface text-loss border border-loss-100 hover:bg-loss-100', 
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-2xl',
}
	
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}	

export function Button({ variant = 'primary', size = 'md', icon, className, children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  )
}
