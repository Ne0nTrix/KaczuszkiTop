import { CloudSun, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

    
export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-cream p-10 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-sun-100 text-amber-500">
        <CloudSun size={40} />
			</span>
      <h1 className="mt-5 text-3xl font-black text-ink">This page is behind a cloud</h1>
      <p className="mt-2 font-semibold text-ink-muted">We could not find what you were looking for.</p>
      <Button className="mt-6" icon={<Home size={16} />} onClick={() => navigate('/map')}> 
        Back to the map
      </Button>
    </div>
  )
}
