// Shared helpers for the image preview surfaces (table lightbox, ImageDropzone
// cards and dialogs). Stored images arrive either as remote URLs or as base64
// data URIs, and both must support "open bigger" and "download".

const extensionOf = (url) => {
  if (typeof url !== 'string' || !url) return 'png'
  if (url.startsWith('data:')) {
    const m = url.match(/^data:image\/([a-z0-9.+-]+)/i)
    if (m) {
      const sub = m[1].toLowerCase()
      if (sub === 'jpeg') return 'jpg'
      if (sub === 'svg+xml') return 'svg'
      return sub
    }
    return 'png'
  }
  const m = url.split('?')[0].split('#')[0].match(/\.([a-z0-9]{2,5})$/i)
  return m ? m[1].toLowerCase() : 'png'
}

export const imageFileName = (label, url) => {
  const base = String(label || 'image')
    .trim()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s+/g, '_') || 'image'
  return `${base}.${extensionOf(url)}`
}

const dataUriToBlob = (dataUri) => {
  const [meta, b64] = dataUri.split(',')
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

const clickDownloadLink = (href, filename) => {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Download the image to the admin's machine. Remote URLs are fetched into a
 * blob first so the `download` attribute is honoured cross-origin; when even
 * that fails (CORS), the image opens in a new tab so it can be saved manually.
 */
export const downloadImage = async (url, label = 'image') => {
  if (typeof url !== 'string' || !url) return false
  const filename = imageFileName(label, url)
  try {
    if (url.startsWith('data:')) {
      const objUrl = URL.createObjectURL(dataUriToBlob(url))
      clickDownloadLink(objUrl, filename)
      setTimeout(() => URL.revokeObjectURL(objUrl), 10000)
      return true
    }
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const objUrl = URL.createObjectURL(await resp.blob())
    clickDownloadLink(objUrl, filename)
    setTimeout(() => URL.revokeObjectURL(objUrl), 10000)
    return true
  } catch {
    window.open(url, '_blank', 'noopener')
    return false
  }
}

/**
 * Open the image full-size in a new browser tab. Data URIs are converted to a
 * blob URL first — most browsers block top-level data: navigation.
 */
export const openImageInNewTab = (url) => {
  if (typeof url !== 'string' || !url) return
  if (url.startsWith('data:')) {
    try {
      const objUrl = URL.createObjectURL(dataUriToBlob(url))
      window.open(objUrl, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(objUrl), 60000)
    } catch {
      // Malformed data URI — nothing sensible to open.
    }
  } else {
    window.open(url, '_blank', 'noopener')
  }
}
