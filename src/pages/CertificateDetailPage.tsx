import { ArrowLeft, Blocks, Copy, Download, ShieldCheck } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom';
import { CertificateView } from '../components/certificates/CertificateView';
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/Skeleton';
import { dateTime } from '../lib/format';
import { usePageLoading } from '../lib/useFakeQuery';
import { useLedger } from '../lib/useLedger';
import { useApp } from '../state/AppStateProvider';
import { useToast } from '../state/ToastProvider';

export function CertificateDetailPage() {
  const { id = '' } = useParams();
  const { world } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate()
  const loading = usePageLoading();
  const blocks = useLedger(world.ledgerEntries)	
  const certificate = world.certificates.find((c) => c.id === id);
  const block = blocks?.find((b) => b.certificateId === id);	

  if(loading) return <PageSkeleton />
  if(!certificate) {
    return (  
      <EmptyState
        title="Certificate not found"
        text={`We could not find ${id} in the registry.`}
        action={<Button onClick={() => navigate('/certificates')}>Back to registry</Button>}
      />
    );
  }

  const copy = () => {
    navigator.clipboard?.writeText(certificate.id).catch(() => undefined);
    toast('Certificate ID copied', certificate.id, 'info');
  };

	return (
    <div>
      <button type="button" onClick={() => navigate('/certificates')} className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink">
        <ArrowLeft size={16} /> All certificates 
      </button>
      <div className="grid grid-cols-[1fr_300px] gap-6">
        <CertificateView certificate={certificate} hash={block?.hash} />
        <div className="space-y-4">
          <Card>
            <CardTitle icon={<ShieldCheck size={18} />} title="Actions" />
            <div className="space-y-2">
              <Button className="w-full" icon={<Download size={16} />} onClick={() => navigate(`/print/certificate/${certificate.id}`)}>
                Download PDF
              </Button>
              <Button variant="secondary" className="w-full" icon={<ShieldCheck size={16} />} onClick={() => navigate(`/verify/${certificate.id}`)}>
                Open verification page
              </Button>
              <Button variant="outline" className="w-full" icon={<Copy size={16} />} onClick={copy}>
                Copy certificate ID
              </Button>
            </div>
          </Card>
          <Card>
            <CardTitle icon={<Blocks size={18} />} title="Ledger entry" subtitle="Anchored in the hash chain" />
            {block ? (
              <div className="space-y-2 text-xs">
                <p className="flex justify-between font-bold text-ink-soft">
                  Block <span className="font-mono text-ink">#{block.index}</span>
                </p>
                <p className="flex justify-between font-bold text-ink-soft">
                  Timestamp <span className="text-ink">{dateTime(block.timestamp)}</span>
                </p>
                <p className="font-bold text-ink-soft">Previous hash</p>
                <p className="rounded-lg bg-cream p-2 font-mono text-[10.5px] break-all text-ink-muted">{block.prevHash}</p>
                <p className="font-bold text-ink-soft">Block hash</p>
                <p className="rounded-lg bg-leaf-50 p-2 font-mono text-[10.5px] break-all text-leaf-700">{block.hash}</p>
                <Button size="sm" variant="ghost" className="w-full" onClick={() => navigate('/certificates?tab=ledger')}>
                  View full ledger  
                </Button> 
              </div>
            ) : (
	              <p className="text-sm text-ink-muted">Computing hash...</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
