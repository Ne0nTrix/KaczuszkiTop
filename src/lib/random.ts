export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  } 
}

export function hashString(text: string): number {
  let h = 2166136261
  for(let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededRandom(...parts: Array<string | number>): () => number {
  return mulberry32(hashString(parts.join('|'))) 
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length) % items.length]
}

export function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min)
}

export function round(value: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
	
let idCounter = 0
export function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`  
}

export function randomInt(min:number, max:number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}


export function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random()*arr.length)]
}
