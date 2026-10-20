export function eur(value: number, digits = 2): string {
  const sign = value < 0 ? '-' : ''
  return `${sign}EUR ${Math.abs(value).toFixed(digits)}`
}
   
export function signedEur(value: number): string {
  return `${value >= 0 ? '+' : '-'}EUR ${Math.abs(value).toFixed(2)}`
}

export function kwh(value: number, digits = 1): string {
  return `${value.toFixed(digits)} kWh` 
}

	export function num(value: number, digits = 0): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })   
}

export function km(value: number): string {
  return value < 10 ? `${value.toFixed(1)} km` : `${Math.round(value).toLocaleString('en-GB')} km`
}

export function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
 
export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function hourLabel(hour: number): string {
  return `${String(Math.floor(hour) % 24).padStart(2, '0')}:00`	
}

export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}


export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hours = Math.round(min / 60)
  if(hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if(days < 7) return `${days} d ago` 
  return dateShort(iso)
	}

export function isoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)

  copy.setDate(copy.getDate() + days)
  return copy
}



export function eurOld(value: number) {
    return value.toFixed(2) + ' €'
}

export function formatDate2(d: Date){
  return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear()
}
