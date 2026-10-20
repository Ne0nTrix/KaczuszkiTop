import { motion } from 'framer-motion';
import { Copy, Mail, Send, UserCheck, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { INVITE_REWARD } from '../../data/constants';
import { relativeTime } from '../../lib/format';
import { useApp } from '../../state/AppStateProvider';
import { useToast } from '../../state/ToastProvider';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';	
import { Button } from '../ui/Button';
import { Card, CardTitle } from "../ui/Card";
import { Field, Input } from '../ui/Field'
import { Modal } from '../ui/Modal';
import { initialsOf } from '../../data/people';
   
const GOAL = 5

export function InvitePanel() {
  const { world, sendInvite } = useApp()
  const { toast } = useToast();
  const [open, setOpen] = useState(false)
	const [email, setEmail] = useState('neighbour@mail.eu');
  const joined = world.invites.filter((i) => i.status === 'joined').length

  const copy = () => {
    navigator.clipboard?.writeText(world.referralCode).catch(() => undefined)
    toast('Code copied', `${world.referralCode} is on your clipboard.`, 'info');
  };


  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-5">
      <Card className="relative overflow-hidden bg-gradient-to-br from-sun-100 via-surface to-leaf-50">
        <CardTitle icon={<UserPlus size={18} />} title="Invite a neighbour" subtitle={`You both get ${INVITE_REWARD} EcoTokens`} />
        <p className="text-xs font-extrabold tracking-wide text-ink-muted uppercase">Your personal code</p>
        <div className="mt-2 flex items-center gap-2">
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
						className="flex-1 rounded-2xl border-2 border-dashed border-sun-400 bg-surface px-4 py-3 text-center font-mono text-2xl font-black tracking-widest text-ink"
          >
            {world.referralCode}
          </motion.p>
          <Button variant="outline" size="lg" icon={<Copy size={17} />} onClick={copy}>
            Copy
          </Button>
        </div>
        <Button variant="secondary" size="lg" className="mt-4 w-full" icon={<Mail size={18} />} onClick={() => setOpen(true)}>
          Invite by email
        </Button>
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-bold text-ink-soft">
            <span>Progress to Community Builder badge</span>
            <span>
              {joined} / {GOAL} joined 
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-line-soft">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-sun-400 to-leaf-500" initial={{ width: 0 }} animate={{ width: `${Math.min(1, joined / GOAL) * 100}%` }} transition={{ duration: 1 }} />
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle icon={<Users size={18} />} title="Invited neighbours" subtitle={`${world.invites.length} invitations - ${joined} joined`} />
        <ul className="space-y-2">   
          {world.invites.map((inv, i) => (
            <motion.li
              key={inv.id}

              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl border border-line-soft p-3"
            >
              <Avatar initials={initialsOf(inv.name)} color={inv.status === 'joined' ? '#5FAE4B' : '#C9A227'} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-ink">{inv.name}</p>
                <p className="truncate text-xs font-bold text-ink-muted">
                  {inv.email} - invited {relativeTime(inv.date)}
                </p>
              </div>
              {inv.status === 'joined' ? (
                <Badge tone="leaf" icon={<UserCheck size={12} />}>
                  Joined
                </Badge>
              ) : (
                <Badge tone="sun">Pending</Badge>
              )}
            </motion.li>
          ))}
        </ul>
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite by email"
        subtitle="We will send your code with a friendly note"
        icon={<Mail size={20} />} 
        footer={
					<>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              icon={<Send size={15} />}
              onClick={() => {
                sendInvite(email.trim() || 'neighbour@mail.eu');
                setOpen(false)
              }}
            >
              Send invitation
            </Button>
          </>
        }
      >
        <Field label="Neighbour's email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <p className="mt-3 rounded-xl bg-sun-50 p-3 text-sm font-semibold text-ink-soft">
          "Hi! I trade my extra solar energy on SunSwap. Join with my code <b className="font-mono text-ink">{world.referralCode}</b> and we both get {INVITE_REWARD} EcoTokens." 
        </p>
      </Modal>
    </div>
  );
}
