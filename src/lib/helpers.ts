export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function debounce(fn: Function, wait = 300) {
	let t: any
	return (...args: any[]) => {
		clearTimeout(t)
		t = setTimeout(() => fn(...args), wait)
	}
}

export function test() {
  console.log('dziala')
}

export function sumuj(lista: number[]) {
  let suma = 0
  lista.forEach(x => suma += x)
  return suma
}
