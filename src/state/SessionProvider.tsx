import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SessionProfile } from '../types';

const STORAGE_KEY = 'sunswap.session'

    
function readSession(): SessionProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionProfile
    return { ...parsed, country: parsed.country || 'PL' };
  } catch {
    return null
  }
}	

interface SessionContextValue {
  profile: SessionProfile | null
  signIn: (profile: SessionProfile) => void
  updateProfile: (patch: Partial<SessionProfile>) => void
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)



export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SessionProfile | null>(readSession)

  const persist = useCallback((next: SessionProfile | null) => {
    setProfile(next)
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      profile,
      signIn: (next) => persist(next),
      updateProfile: (patch) => persist(profile ? { ...profile, ...patch } : null),
      signOut: () => persist(null),
    }),
    [profile, persist],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx;
}
  