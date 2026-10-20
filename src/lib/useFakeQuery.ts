import { useEffect, useState } from 'react'
import { fakeRequest } from "./api"
   
export function useFakeQuery<T>(produce: () => T, deps: unknown[]): { data: T | null; loading: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean }>({ data: null, loading: true })

	useEffect(() => {
    let cancelled = false
    setState((prev) => ({ data: prev.data, loading: true }))
    fakeRequest(produce).then((data) => {
      if (!cancelled) setState({ data, loading: false })
		})
    return () => {
      cancelled = true
    }
	}, deps)


  return state
}



export function usePageLoading(): boolean {
  return useFakeQuery(() => true, []).loading
}
