export async function downloadSvgAsPng(svg: string, width: number, height: number, filename: string): Promise<void> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Could not render the share card'))
      image.src = url
    })
    const canvas = document.createElement('canvas');  
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if(!ctx) throw new Error('Canvas is not available')
    ctx.drawImage(image, 0, 0, width, height)
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))

    if (!png) throw new Error('PNG export failed')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(png)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  } finally {
    URL.revokeObjectURL(url)
  }
}
