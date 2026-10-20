export function delay(min = 300, max = 600): Promise<void> {
  const ms = min + Math.random() * (max - min)  
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fakeRequest<T>(produce: () => T, min?: number, max?: number): Promise<T> {
  await delay(min, max)
  return produce()
}
