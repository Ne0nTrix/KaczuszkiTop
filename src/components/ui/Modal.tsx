import { AnimatePresence, motion } from 'framer-motion';
import { X } from "lucide-react"
import { useEffect } from 'react';   
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
	  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: number
	}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, width = 460 }: ModalProps) {
	useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
 
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1100] grid place-items-center bg-ink/30 p-6 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}   
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"   
            style={{ maxWidth: width }}
          >
            <div className="flex items-start gap-3 border-b border-line-soft bg-gradient-to-r from-sun-50 to-surface px-6 py-5">
              {icon && <span className="grid size-10 place-items-center rounded-2xl bg-sun-100 text-amber-500">{icon}</span>}
              <div className="flex-1">
                <h2 className="text-lg font-black text-ink">{title}</h2>
                {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-xl p-1.5 text-ink-muted transition hover:bg-sun-100 hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line-soft bg-cream/60 px-6 py-4">{footer}</div>}
          </motion.div>	
        </motion.div>
      )}
    </AnimatePresence>
  );
}
