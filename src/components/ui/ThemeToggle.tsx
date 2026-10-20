import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../state/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
	const dark = theme === 'dark'
  return (
		<motion.button
			type="button"
			whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
			className="relative flex h-10 w-[68px] cursor-pointer items-center rounded-full border border-line bg-surface p-1 shadow-soft"
			aria-label={dark ? 'Switch to day mode' : 'Switch to night mode'}
      title={dark ? 'Day mode' : 'Night mode'}
    >
      <motion.span
        layout 
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`grid size-8 place-items-center rounded-full ${dark ? 'ml-auto bg-sun-200 text-sun-300' : 'bg-sun-400 text-on-sun'}`}
			>
				<AnimatePresence mode="wait" initial={false}>
					<motion.span
            key={theme}
            initial={{ rotate: -120, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 120, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
						{dark ? <Moon size={16} /> : <Sun size={16} />}	
    

          </motion.span>
        </AnimatePresence>
			</motion.span>
    </motion.button>
	)
}
