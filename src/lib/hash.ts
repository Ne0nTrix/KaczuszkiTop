function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))	
    .join('')
}

function fallbackHash(text: string): string {
  let out = '';
  let h = 0x811c9dc5;
  for(let round = 0; round < 8; round++) {
    for (let i = 0; i < text.length; i++) {  
      h ^= text.charCodeAt(i) + round;
      h = Math.imul(h, 16777619) >>> 0;
    }
    out += h.toString(16).padStart(8, '0');
  }
  return out
}

export async function sha256(text: string): Promise<string> {
  if(globalThis.crypto?.subtle) {
	    const data = new TextEncoder().encode(text);
    return toHex(await crypto.subtle.digest('SHA-256', data));
  }
  return fallbackHash(text);
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}
