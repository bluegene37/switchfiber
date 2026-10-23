// Shared helpers for the image preview surfaces (table lightbox, ImageDropzone
// cards and dialogs). Stored images arrive either as remote URLs or as base64
// data URIs, and both must support "open bigger" and "download".

/*
// Gene - Oct 23, 2026: Convert Google Drive URLs and API FileContentResult objects to browser-renderable image URLs
export const getDirectImageUrl = (val) => {
  if (!val || typeof val !== 'string') return ''
  const trimmed = val.trim()
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) return trimmed

  // Check if value is a Google Drive open / file view URL
  const gdriveMatch = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i)
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`
  }

  return trimmed
}
*/
// Gene - Oct 23, 2026: Enhanced getDirectImageUrl to safely sanitize non-renderable server disk paths, export unwrapApiPayload and isRenderableImageUrl
export const isRenderableImageUrl = (val) => {
  if (!val || typeof val !== 'string') return false
  const trimmed = val.trim()
  return trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
}

export const unwrapApiPayload = (res) => {
  if (!res) return null
  if (typeof res === 'object') {
    // If res has a data property that is an object containing image fields, unwrap it
    if (res.data && typeof res.data === 'object' && !('fileContents' in res)) {
      return res.data
    }
  }
  return res
}

export const getDirectImageUrl = (val) => {
  if (!val || typeof val !== 'string') return ''
  const trimmed = val.trim()
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) return trimmed

  // Check if value is a Google Drive open / file view URL
  const gdriveMatch = trimmed.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/i)
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gdriveMatch[1]}`
  }

  // If it is an absolute web URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Windows disk paths (D:\..., C:\...), bare filenames ("house.jpg"), or text labels ("None", "UMID") are not direct browser URLs
  return ''
}

export const fileResultToDataUrl = (fileResult) => {
  if (!fileResult) return null
  if (typeof fileResult === 'string') return getDirectImageUrl(fileResult)
  if (typeof fileResult === 'object' && fileResult.fileContents) {
    const mime = fileResult.contentType || 'image/jpeg'
    return `data:${mime};base64,${fileResult.fileContents}`
  }
  return null
}

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

/*
const dataUriToBlob = (dataUri) => {
  const [meta, b64] = dataUri.split(',')
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/png'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
*/
// Gene - Oct 23, 2026: Export dataUriToBlob to convert base64 data URIs back to Blobs for multipart update preservation
export const dataUriToBlob = (dataUri) => {
  if (!dataUri || typeof dataUri !== 'string' || !dataUri.includes(',')) return null
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
