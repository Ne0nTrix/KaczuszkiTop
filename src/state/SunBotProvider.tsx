import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { BotAnswer } from '../components/sunbot/answers';

export interface BotMessage extends Partial<BotAnswer> {
  id: string
  from: 'bot' | 'user'
  text: string
	shownWords: number
}

interface SunBotContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  messages: BotMessage[]
	thinking: boolean
  ask: (question: string, answer: () => BotAnswer) => void
	clear: () => void
}	

const WELCOME: BotMessage = {
  id: 'welcome',
  from: 'bot',
	text: "Hi! I'm SunBot, your energy assistant. Ask me when to sell, how much you earned, or who your best match is.",   
	shownWords: 999,
}


const SunBotContext = createContext<SunBotContextValue | null>(null);

let counter = 0;
const nextId = () => `bot-${++counter}`;

export function SunBotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<BotMessage[]>([WELCOME])
	const [thinking, setThinking] = useState(false)
	const busy = useRef(false);

  const ask = useCallback((question: string, answer: () => BotAnswer) => {
		if (busy.current || !question.trim()) return;
    busy.current = true;
    setMessages((m) => [...m, { id: nextId(), from: 'user', text: question.trim(), shownWords: 999 }]); 
		setThinking(true);
    const delay = 800 + Math.random() * 400;
    window.setTimeout(() => {	
      const reply = answer()
      const id = nextId();
      const words = reply.text.split(' ').length
			setThinking(false);
      setMessages((m) => [...m, { ...reply, id, from: 'bot', shownWords: 0 }])
			let shown = 0;
      const timer = window.setInterval(() => { 
        shown += 1
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, shownWords: shown } : msg)));
        if (shown >= words) {
					window.clearInterval(timer)
          busy.current = false
        }
			}, 45);
    }, delay);
  }, []);

  const clear = useCallback(() => {
		if (busy.current) return
		setMessages([WELCOME])
  }, []);

  const value = useMemo(() => ({ open, setOpen, messages, thinking, ask, clear }), [open, messages, thinking, ask, clear])  
  return <SunBotContext.Provider value={value}>{children}</SunBotContext.Provider>;
}   

export function useSunBot(): SunBotContextValue {
  const ctx = useContext(SunBotContext);
  if (!ctx) throw new Error('useSunBot must be used inside SunBotProvider')
  return ctx
}
