import { motion } from 'framer-motion'
import { Navigate, useLocation, useOutlet } from 'react-router-dom'
import { SmartContractModal } from "../components/contract/SmartContractModal"
import { DemoControls } from '../components/layout/DemoControls'
import { Sidebar } from "../components/layout/Sidebar" 
import { TopBar } from '../components/layout/TopBar' 
import { SunBot } from '../components/sunbot/SunBot'
import { useSession } from "../state/SessionProvider"

export function AppLayout() {
  const { profile } = useSession()
  const location = useLocation()

  const outlet = useOutlet()

  if (!profile) return <Navigate to="/login" replace />

  const fullBleed = location.pathname === '/map'

	return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={fullBleed ? 'h-full' : 'mx-auto max-w-[1500px] px-7 py-6 pb-20'}
          >
            {outlet}
          </motion.div>
        </main>
	      </div>
      <DemoControls />
      <SunBot />
      <SmartContractModal />
    </div>
  )
}
	