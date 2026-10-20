import { useParams } from "react-router-dom"
	import { CertificateView } from '../components/certificates/CertificateView'
import { EmptyState } from "../components/ui/EmptyState"
import { useLedger } from "../lib/useLedger"
import { useApp } from "../state/AppStateProvider"
import { PrintLayout } from "./PrintLayout"

export function PrintCertificatePage() {
  const { id = '' } = useParams()
  const { world } = useApp()  
  const blocks = useLedger(world.ledgerEntries)
  const certificate = world.certificates.find((c) => c.id === id)

  return (
    <PrintLayout ready={!!certificate && !!blocks}>
      {certificate ? (
        <CertificateView certificate={certificate} hash={blocks?.find((b) => b.certificateId === id)?.hash} />
      ) : (
        <EmptyState title="Certificate not found" text={`No certificate with ID ${id}.`} />
      )}
	    </PrintLayout>
  )
}
