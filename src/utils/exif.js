// EXIF extraction for the image preview surfaces (ImageDropzone dialog and
// the table lightbox). Stored images are mostly base64 data URIs captured on
// upload, so the original camera metadata survives intact; remote URLs are
// fetched and may fail CORS, in which case we report "unavailable" rather
// than throw.

import exifr from 'exifr'

const round = (n, places = 2) => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

const formatExposureTime = (t) => {
  if (typeof t !== 'number' || t <= 0) return null
  if (t >= 1) return `${round(t)} s`
  return `1/${Math.round(1 / t)} s`
}

const formatDate = (d) => {
  if (d instanceof Date && !isNaN(d)) return d.toLocaleString()
  if (typeof d === 'string' && d) return d
  return null
}

const COLOR_SPACES = { 1: 'sRGB', 2: 'Adobe RGB', 65535: 'Uncalibrated' }
const formatColorSpace = (cs) => {
  if (typeof cs === 'string') return cs
  if (typeof cs === 'number') return COLOR_SPACES[cs] || null
  return null
}

const FLASH_FIRED_BIT = 0x1
const formatFlash = (flash) => {
  if (typeof flash === 'string') return flash
  if (typeof flash === 'number') return (flash & FLASH_FIRED_BIT) ? 'Fired' : 'Did not fire'
  return null
}

const pushRow = (rows, label, value) => {
  if (value === null || value === undefined || value === '') return
  rows.push({ label, value: String(value) })
}

/**
 * Parse EXIF metadata from an image source (data URI or URL) and shape it
 * into display-ready sections: [{ key, title, icon, rows: [{label, value}] }].
 * Returns [] when the image carries no metadata. Throws on fetch/parse
 * failure so callers can distinguish "no EXIF" from "could not read".
 */
export const extractExifSections = async (src) => {
  if (typeof src !== 'string' || !src) return []

  const data = await exifr.parse(src, {
    tiff: true,
    exif: true,
    gps: true,
    interop: false,
    translateValues: true,
    reviveValues: true
  })
  if (!data || Object.keys(data).length === 0) return []

  const sections = []

  const camera = []
  pushRow(camera, 'Make', data.Make)
  pushRow(camera, 'Model', data.Model)
  pushRow(camera, 'Lens', data.LensModel)
  pushRow(camera, 'Software', data.Software)
  if (camera.length) sections.push({ key: 'camera', title: 'Camera', icon: 'pi pi-camera', rows: camera })

  const capture = []
  pushRow(capture, 'Taken', formatDate(data.DateTimeOriginal || data.CreateDate || data.ModifyDate))
  pushRow(capture, 'Exposure', formatExposureTime(data.ExposureTime))
  pushRow(capture, 'Aperture', typeof data.FNumber === 'number' ? `f/${round(data.FNumber, 1)}` : null)
  pushRow(capture, 'ISO', data.ISO)
  pushRow(capture, 'Focal Length', typeof data.FocalLength === 'number' ? `${round(data.FocalLength, 1)} mm` : null)
  pushRow(capture, 'Flash', formatFlash(data.Flash))
  pushRow(capture, 'White Balance', data.WhiteBalance)
  pushRow(capture, 'Orientation', data.Orientation)
  if (capture.length) sections.push({ key: 'capture', title: 'Capture Settings', icon: 'pi pi-sliders-h', rows: capture })

  const image = []
  const width = data.ExifImageWidth || data.ImageWidth
  const height = data.ExifImageHeight || data.ImageHeight
  if (width && height) pushRow(image, 'Dimensions', `${width} × ${height} px`)
  pushRow(image, 'Resolution', data.XResolution ? `${round(data.XResolution)} dpi` : null)
  pushRow(image, 'Color Space', formatColorSpace(data.ColorSpace))
  if (image.length) sections.push({ key: 'image', title: 'Image', icon: 'pi pi-image', rows: image })

  if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    const gps = []
    pushRow(gps, 'Latitude', round(data.latitude, 6))
    pushRow(gps, 'Longitude', round(data.longitude, 6))
    pushRow(gps, 'Altitude', typeof data.GPSAltitude === 'number' ? `${round(data.GPSAltitude, 1)} m` : null)
    sections.push({
      key: 'gps',
      title: 'Location',
      icon: 'pi pi-map-marker',
      rows: gps,
      mapUrl: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`
    })
  }

  return sections
}
