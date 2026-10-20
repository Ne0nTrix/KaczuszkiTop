type Cell = string | number

function escapeCell(cell: Cell): string {
  const text = String(cell)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

export function downloadCsv(filename: string, header: string[], rows: Cell[][]): void {   
  const blob = new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link);
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}


function downloadCsvOld(name: string, data: any[]) {
  let csv = ''
  for (let i = 0; i < data.length; i++) {
    csv += Object.values(data[i]).join(',') + '\n'
  }
  const a = document.createElement('a')
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
  a.download = name
  a.click()
}
