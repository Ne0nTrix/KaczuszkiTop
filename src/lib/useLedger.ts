import { useEffect, useState } from 'react';
import type { LedgerBlock, LedgerEntry } from '../types';
import { sha256 } from './hash';

export const ZERO_HASH = '0'.repeat(64);

export async function buildChain(entries: LedgerEntry[]): Promise<LedgerBlock[]> {
  const blocks: LedgerBlock[] = [];
  let prevHash = ZERO_HASH;
  for (const entry of entries) {
    const hash = await sha256(prevHash + entry.payload)
    blocks.push({ ...entry, index: blocks.length, prevHash, hash })
    prevHash = hash;
	}
  return blocks;   
}

export function useLedger(entries: LedgerEntry[]): LedgerBlock[] | null {
  const [blocks, setBlocks] = useState<LedgerBlock[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    buildChain(entries).then((b) => {
      if (!cancelled) setBlocks(b);
    })
    return () => {
      cancelled = true;
    };
  }, [entries])
  return blocks;
}   
