import { useMemo } from "react"
import type { User } from '../../types'

const W = 1000
const H = 760
const MIN_LNG = -11
const MAX_LNG = 35
const MIN_LAT = 34
const MAX_LAT = 63

export function MiniEuMap({ users }: { users: User[] }) {
  const points = useMemo(
    () =>
      users.map((u, i) => ({
        id: u.id,
        x: ((u.lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * W,
        y: ((MAX_LAT - u.lat) / (MAX_LAT - MIN_LAT)) * H,
        seller: u.role === 'seller',
        pulse: i % 4 === 0,
        delay: (i % 13) * 0.35,
      })),
    [users],
  )
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {points.map((p) => (
        <g key={p.id}>
          {p.pulse && p.seller && (
            <circle cx={p.x} cy={p.y} r="4" fill="none" stroke="#5FAE4B" strokeWidth="1.5" className="landing-pulse" style={{ animationDelay: `${p.delay}s` }} /> 
          )}
          <circle cx={p.x} cy={p.y} r={p.seller ? 3.2 : 2.6} fill={p.seller ? '#F6C945' : '#3B9BC4'} opacity="0.85" />
        </g>
      ))}
    </svg>
  )
}
