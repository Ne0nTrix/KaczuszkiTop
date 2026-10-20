import { ArrowLeft, Printer } from "lucide-react"
import { useEffect } from 'react'
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"

export function PrintLayout({ children, ready = true }: { children: ReactNode; ready?: boolean }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => window.print(), 700)
    return () => clearTimeout(timer)
  }, [ready])
 
  return (
    <div className="min-h-full bg-[#f3efdc] py-8 print:bg-surface print:py-0">
			<div className="no-print mx-auto mb-5 flex max-w-[900px] items-center justify-between">
        <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
          Back
        </Button>
				<Button icon={<Printer size={16} />} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>
      <div className="mx-auto max-w-[900px]">{children}</div>
		</div> 
  )
}
