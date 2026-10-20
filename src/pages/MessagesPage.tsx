import { AnimatePresence, motion } from 'framer-motion';
import { Check, ExternalLink, MessageCircle, Search, Send, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react'  
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ChatThread } from '../types';

import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState';
	import { ListSkeleton } from '../components/ui/Skeleton'
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { QUICK_REPLIES } from '../data/phrases';


import { cn } from '../lib/cn';
import { eur, kwh, relativeTime, timeOnly } from '../lib/format'
import { usePageLoading } from '../lib/useFakeQuery';
import { useApp } from '../state/AppStateProvider';


function TypingDots() {
  return ( 
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3">
      {[0, 1, 2].map((i) => (  
				<motion.span
          key={i}
          className="size-2 rounded-full bg-ink-muted"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function lastMessage(t: ChatThread) {
  return t.messages[t.messages.length - 1];
}

export function MessagesPage() {
  const { world, me, getUser, sendMessage, setActiveThread, acceptChatOffer } = useApp();
  const loading = usePageLoading()
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('')	
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = [...world.threads].sort((a, b) => (lastMessage(b)?.time ?? '9').localeCompare(lastMessage(a)?.time ?? '9'));
  const activeId = params.get('thread') ?? threads[0]?.id ?? null
  const active = world.threads.find((t) => t.id === activeId) ?? null
  const partner = active ? getUser(active.userId) : undefined;

  useEffect(() => {
    setActiveThread(activeId)
    return () => setActiveThread(null);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })   
  }, [active?.messages.length, active?.typing, loading]);

  const send = (text: string) => {
    if (!active || !text.trim()) return
    sendMessage(active.id, text.trim())
    setDraft('');

	  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  }

  const visibleThreads = threads.filter((t) => {
    const u = getUser(t.userId)
    return !query || u?.name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="grid h-[calc(100vh-64px-48px-80px)] min-h-[540px] grid-cols-[340px_1fr] overflow-hidden rounded-3xl border border-line bg-surface shadow-soft">
      <div className="flex min-h-0 flex-col border-r border-line bg-sun-50/40">
        <div className="border-b border-line-soft p-4">
          <h1 className="mb-3 text-xl font-black text-ink">Messages</h1>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="h-9 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm font-semibold outline-none focus:border-sun-400"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-2">
              <ListSkeleton rows={6} />
            </div>
          ) : visibleThreads.length === 0 ? (
            <p className="p-4 text-sm text-ink-muted">No conversations found.</p>
          ) : (
            visibleThreads.map((t) => {
              const u = getUser(t.userId);
              if(!u) return null;
              const last = lastMessage(t)
              const isActive = t.id === activeId;
	              return (
                <motion.button
                  key={t.id}
                  layout
                  type="button"
                  onClick={() => setParams({ thread: t.id })}
                  className={cn('mb-1 flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition', isActive ? 'bg-sun-100 shadow-soft' : 'hover:bg-surface')}
                >
                  <span className="relative">
                    <Avatar initials={u.initials} color={u.avatarColor} size={44} />
                    {t.online && <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-leaf-500" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-extrabold text-ink">{u.name}</span>
                      <span className="shrink-0 text-[11px] font-bold text-ink-muted">{last ? relativeTime(last.time) : 'new'}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-[13px]', t.unread ? 'font-bold text-ink' : 'text-ink-muted')}>
                        {t.typing ? <i className="text-leaf-600">typing...</i> : last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'Say hello!'}
                      </span>
                      {t.unread > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white">	
                          {t.unread}
                        </motion.span>   
                      )}
                    </span>
                  </span>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {!active || !partner ? (
        <div className="grid place-items-center p-10">
          <EmptyState icon={<MessageCircle size={26} />} title="Pick a conversation" text="Choose a neighbour on the left, or send a message from any profile." />
        </div>
      ) : (
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 border-b border-line-soft px-5 py-3.5">
            <Avatar initials={partner.initials} color={partner.avatarColor} size={42} />
            <div className="flex-1">
              <p className="flex items-center gap-1.5 font-extrabold text-ink">
                {partner.name} {partner.verified && <VerifiedBadge size={15} />}
              </p>
              <p className="text-xs font-bold text-ink-muted">
                {active.online ? <span className="text-leaf-600">Online</span> : 'Offline'} - {partner.city}, {partner.country} - {partner.role === 'seller' ? `${kwh(partner.surplusKwh)} surplus at ${eur(partner.pricePerKwh)}/kWh` : 'Buyer'}
              </p>
            </div>
            <Button size="sm" variant="outline" icon={<ExternalLink size={14} />} onClick={() => navigate(`/users/${partner.id}`)}>
							View profile
						</Button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-cream/60 to-surface px-6 py-5">
            {active.messages.length === 0 && (
              <div className="py-10 text-center text-sm font-semibold text-ink-muted">
                This is the start of your conversation with {partner.name.split(' ')[0]}. Say hello!
              </div>
						)}
            <AnimatePresence initial={false}>
              {active.messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}   
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
	                  className={cn('flex items-end gap-2', m.from === 'me' && 'flex-row-reverse')}
                >
                  {m.from === 'them' ? <Avatar initials={partner.initials} color={partner.avatarColor} size={28} /> : <Avatar initials={me.initials} color={me.avatarColor} size={28} />}
                  <div
                    className={cn(
                      'max-w-[62%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      m.from === 'me' ? 'rounded-br-md bg-leaf-500 font-semibold text-white dark:text-on-sun' : 'rounded-bl-md border border-line bg-surface text-ink',
                    )}
                  >
                    {m.text}
                    {m.offer && (
                      <span className="mt-2 flex items-center gap-3 rounded-xl border border-sun-300 bg-sun-50 p-2.5 text-ink">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sun-400 text-on-sun">
                          <Zap size={16} />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">Offer</span>
                          <span className="block font-black">
                            {m.offer.kwh} kWh at {eur(m.offer.pricePerKwh)}
                          </span>
                        </span>
                        {m.offer.status === 'open' ? (
                          <button
                            type="button"
                            onClick={() => acceptChatOffer(active.id, m.id)}
                            className="flex cursor-pointer items-center gap-1 rounded-lg bg-leaf-500 px-2.5 py-1.5 text-xs font-black text-white dark:text-on-sun transition hover:bg-leaf-600"
                          >
                            <Check size={13} /> Accept
                          </button>
                        ) : (
                          <span className="rounded-lg bg-leaf-100 px-2 py-1 text-xs font-black text-leaf-700">Accepted</span>	
                        )}
                      </span>
                    )} 
                    <span className={cn('mt-0.5 block text-right text-[10px] font-bold', m.from === 'me' ? 'text-white/75' : 'text-ink-muted')}>{timeOnly(m.time)}</span>
                  </div>
                </motion.div>
              ))}
              {active.typing && (
                <div key="typing" className="flex items-end gap-2">
                  <Avatar initials={partner.initials} color={partner.avatarColor} size={28} />
                  <TypingDots />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-line-soft p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_REPLIES.map((q) => (  
                <motion.button
                  key={q}
                  type="button"
                  whileHover={{ y: -2 }}

                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(q)}
                  className="cursor-pointer rounded-full border border-line bg-sun-50 px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:border-sun-400 hover:bg-sun-100 hover:text-ink"
                >
                  {q}
                </motion.button>
              ))}
            </div>
            <form onSubmit={submit} className="flex gap-2">
              <input
                value={draft}

                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${partner.name.split(' ')[0]}...`}
                className="h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink outline-none transition focus:border-sun-400 focus:ring-4 focus:ring-sun-200/60"
              />
              <Button type="submit" variant="secondary" size="md" className="h-11" icon={<Send size={16} />} disabled={!draft.trim()}>
                Send   
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
