import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Coins, Info, Sparkles, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'info' | 'warning' | 'token'

interface Toast {
  id: number   
  title: string
  description?: string
  tone: ToastTone
}

interface TokenBurst {
  id: number
  amount: number   
}

interface ToastContextValue {
  toast: (title: string, description?: string, tone?: ToastTone) => void
  celebrateTokens: (amount: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; ring: string; iconBg: string }> = {
  success: { icon: CheckCircle2, ring: 'border-leaf-200', iconBg: 'bg-leaf-100 text-leaf-700' },
  info: { icon: Info, ring: 'border-line', iconBg: 'bg-sun-100 text-amber-500' },
  warning: { icon: AlertTriangle, ring: 'border-orange-100', iconBg: 'bg-orange-100 text-orange-500' },
  token: { icon: Sparkles, ring: 'border-sun-300', iconBg: 'bg-sun-300 text-ink' },
	};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bursts, setBursts] = useState<TokenBurst[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (title: string, description?: string, tone: ToastTone = 'success') => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const celebrateTokens = useCallback((amount: number) => {
    const id = nextId.current++;
    setBursts((all) => [...all, { id, amount }]);
    setTimeout(() => setBursts((all) => all.filter((b) => b.id !== id)), 2200);
  }, [])

  const value = useMemo(() => ({ toast, celebrateTokens }), [toast, celebrateTokens]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="no-print pointer-events-none fixed top-20 right-6 z-[1200] flex w-[360px] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const style = TONE_STYLES[t.tone];
            const Icon = style.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface/95 p-3.5 shadow-lift backdrop-blur ${style.ring}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${style.iconBg}`}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-extrabold text-ink">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{t.description}</p>}
                </div>
                <button
                  type="button"  
                  onClick={() => dismiss(t.id)}
                  className="rounded-lg p-1 text-ink-muted transition hover:bg-sun-100 hover:text-ink"
                  aria-label="Dismiss"
                >
                  <X size={14} />	
                </button>
              </motion.div>
            );
          })}	
        </AnimatePresence>
      </div>
      <div className="no-print pointer-events-none fixed inset-0 z-[1300] grid place-items-center"> 
        <AnimatePresence>
          {bursts.map((b) => (
	            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.4, y: 40 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 0.9], y: [40, 0, -20, -140] }}
              transition={{ duration: 2, times: [0, 0.2, 0.65, 1], ease: 'easeOut' }}
              className="absolute flex items-center gap-3 rounded-full border-2 border-sun-400 bg-surface px-6 py-3 shadow-lift"
            >
              <motion.span
                animate={{ rotateY: [0, 360, 720] }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-sun-300 to-amber-500 text-ink shadow-soft"
              > 
                <Coins size={22} />
              </motion.span>
              <span className="text-2xl font-black text-leaf-700">+{b.amount} EcoTokens</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx;
}
