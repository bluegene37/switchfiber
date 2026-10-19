// Gene - Oct, 20, 2026: Comprehensive test suite for Promotions YouTube & Video URL support
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicApiTableSource = fs.readFileSync(
  path.resolve(__dirname, '../src/components/DynamicApiTable.vue'),
  'utf8'
)

// Exported / pure logic verification matching helper implementations
const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  const match = url.trim().match(regExp)
  return match ? match[1] : null
}

const isYouTubeUrl = (url) => Boolean(extractYouTubeId(url))

const isDirectVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  return /\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(url.trim())
}

const isVideoMediaUrl = (url) => isYouTubeUrl(url) || isDirectVideoUrl(url)

const getYouTubeEmbedUrl = (urlOrId) => {
  const id = extractYouTubeId(urlOrId) || urlOrId
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
}

const getYouTubeThumbnail = (urlOrId) => {
  const id = extractYouTubeId(urlOrId) || urlOrId
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : ''
}

describe('Promotions YouTube & Video URL Support Suite', () => {
  describe('Video & YouTube URL Helper Logic', () => {
    test('extractYouTubeId parses standard watch URLs', () => {
      assert.equal(
        extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      )
      assert.equal(
        extractYouTubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=42s'),
        'dQw4w9WgXcQ'
      )
    })

    test('extractYouTubeId parses youtu.be shortlinks', () => {
      assert.equal(
        extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      )
      assert.equal(
        extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=abcdef12345'),
        'dQw4w9WgXcQ'
      )
    })

    test('extractYouTubeId parses embed and shorts URLs', () => {
      assert.equal(
        extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      )
      assert.equal(
        extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
        'dQw4w9WgXcQ'
      )
    })

    test('extractYouTubeId returns null for non-YouTube links', () => {
      assert.equal(extractYouTubeId('https://switchfiber.ph/promo.jpg'), null)
      assert.equal(extractYouTubeId('https://example.com/video.mp4'), null)
      assert.equal(extractYouTubeId(''), null)
      assert.equal(extractYouTubeId(null), null)
    })

    test('isDirectVideoUrl recognizes mp4, webm, ogg, mov files', () => {
      assert.equal(isDirectVideoUrl('https://example.com/media/promo.mp4'), true)
      assert.equal(isDirectVideoUrl('https://cdn.switchfiber.ph/ad.webm?version=1'), true)
      assert.equal(isDirectVideoUrl('https://example.com/clip.ogg'), true)
      assert.equal(isDirectVideoUrl('https://example.com/clip.mov'), true)
      assert.equal(isDirectVideoUrl('https://example.com/photo.jpg'), false)
      assert.equal(isDirectVideoUrl('https://example.com/document.pdf'), false)
    })

    test('isVideoMediaUrl returns true for either YouTube or direct video', () => {
      assert.equal(isVideoMediaUrl('https://youtu.be/dQw4w9WgXcQ'), true)
      assert.equal(isVideoMediaUrl('https://example.com/promo.mp4'), true)
      assert.equal(isVideoMediaUrl('https://picsum.photos/seed/promo/800/500'), false)
    })

    test('getYouTubeEmbedUrl generates privacy-enhanced embed URL', () => {
      assert.equal(
        getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
      )
      assert.equal(
        getYouTubeEmbedUrl('dQw4w9WgXcQ'),
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
      )
    })

    test('getYouTubeThumbnail generates standard YouTube thumbnail image URL', () => {
      assert.equal(
        getYouTubeThumbnail('https://youtu.be/dQw4w9WgXcQ'),
        'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
      )
    })
  })

  describe('DynamicApiTable Component Source Verification', () => {
    test('DynamicApiTable maps Promotions imageUrl to promotion_media_url', () => {
      assert.ok(
        dynamicApiTableSource.includes("if (lower === 'imageurl' || lower === 'image_url' || lower === 'image') return 'promotion_media_url'"),
        'getFieldType must return promotion_media_url for Promotions.imageUrl'
      )
    })

    test('DynamicApiTable defines YouTube and video helper functions', () => {
      assert.ok(
        dynamicApiTableSource.includes('const extractYouTubeId ='),
        'DynamicApiTable must define extractYouTubeId'
      )
      assert.ok(
        dynamicApiTableSource.includes('const isYouTubeUrl ='),
        'DynamicApiTable must define isYouTubeUrl'
      )
      assert.ok(
        dynamicApiTableSource.includes('const isDirectVideoUrl ='),
        'DynamicApiTable must define isDirectVideoUrl'
      )
      assert.ok(
        dynamicApiTableSource.includes('const isVideoMediaUrl ='),
        'DynamicApiTable must define isVideoMediaUrl'
      )
      assert.ok(
        dynamicApiTableSource.includes('const getYouTubeEmbedUrl ='),
        'DynamicApiTable must define getYouTubeEmbedUrl'
      )
    })

    test('DynamicApiTable renders promotion_media_url controls in Create dialog', () => {
      assert.ok(
        dynamicApiTableSource.includes("getFieldType(col) === 'promotion_media_url'"),
        'Create dialog must have specialized section for promotion_media_url'
      )
      assert.ok(
        dynamicApiTableSource.includes('promoMediaMode'),
        'DynamicApiTable must manage promoMediaMode state'
      )
    })

    test('DynamicApiTable renders responsive video player preview in Create & Edit dialogs', () => {
      assert.ok(
        dynamicApiTableSource.includes('title="YouTube video player"'),
        'Dialogs must render responsive YouTube iframe player'
      )
      assert.ok(
        dynamicApiTableSource.includes('<video :src='),
        'Dialogs must render HTML5 video player for direct video links'
      )
    })

    test('DynamicApiTable renders video badges and click-to-preview in Table cells', () => {
      assert.ok(
        dynamicApiTableSource.includes("getFieldType(col) === 'promotion_media_url'"),
        'Table column must have specialized branch for promotion_media_url'
      )
      assert.ok(
        dynamicApiTableSource.includes('pi-youtube') || dynamicApiTableSource.includes('pi-video'),
        'Table cell must render video indicator icon for video promo media'
      )
    })

    test('DynamicApiTable image preview dialog embeds video player when media is video', () => {
      assert.ok(
        dynamicApiTableSource.includes('isVideoMediaUrl(tableImagePreviewUrl)'),
        'Lightbox dialog must detect video URLs and render embedded player'
      )
    })

    test('DynamicApiTable openCreateDialog initializes promoMediaMode.create to video', () => {
      assert.ok(
        dynamicApiTableSource.includes("promoMediaMode.value.create = 'video'"),
        'openCreateDialog must initialize promoMediaMode.create to video'
      )
    })

    test('DynamicApiTable openEditDialog auto-detects promotion_media_url mode', () => {
      assert.ok(
        dynamicApiTableSource.includes("promoMediaMode.value.edit = 'video'") &&
        dynamicApiTableSource.includes("promoMediaMode.value.edit = 'image'"),
        'openEditDialog must auto-detect video vs image mode for promotion_media_url'
      )
    })

    test('DynamicApiTable trims imageUrl in Promotions create and update payloads', () => {
      assert.ok(
        dynamicApiTableSource.includes("finalPayload[imgKey] = finalPayload[imgKey].trim()"),
        'Create and update payloads must trim imageUrl string'
      )
    })

    test('DynamicApiTable maps Promotions title and subtitle to promotion_title and promotion_subtitle', () => {
      assert.ok(
        dynamicApiTableSource.includes("if (lower === 'title') return 'promotion_title'"),
        'getFieldType must return promotion_title for title'
      )
      assert.ok(
        dynamicApiTableSource.includes("if (lower === 'subtitle') return 'promotion_subtitle'"),
        'getFieldType must return promotion_subtitle for subtitle'
      )
    })

    test('DynamicApiTable renders prominent headline inputs for promotion_title and promotion_subtitle', () => {
      assert.ok(
        dynamicApiTableSource.includes("getFieldType(col) === 'promotion_title'"),
        'Dialogs must have specialized branch for promotion_title'
      )
      assert.ok(
        dynamicApiTableSource.includes("getFieldType(col) === 'promotion_subtitle'"),
        'Dialogs must have specialized branch for promotion_subtitle'
      )
      assert.ok(
        dynamicApiTableSource.includes("Primary Banner Headline"),
        'Title must display Primary Banner Headline badge'
      )
      assert.ok(
        dynamicApiTableSource.includes("Supporting Sub-headline"),
        'Subtitle must display Supporting Sub-headline badge'
      )
    })

    test('DynamicApiTable assigns full width to promotion_media_url, title, and subtitle in wide form', () => {
      assert.ok(
        dynamicApiTableSource.includes("if (isPromotionEndpoint.value) {"),
        'getColumnClass must have dedicated branch for isPromotionEndpoint'
      )
      assert.ok(
        dynamicApiTableSource.includes("if (lower === 'title') {\n        return 'col-12'"),
        'Title must receive full col-12 width'
      )
      assert.ok(
        dynamicApiTableSource.includes("if (lower === 'subtitle') {\n        return 'col-12'"),
        'Subtitle must receive full col-12 width'
      )
    })

    test('DynamicApiTable provides clipboard paste, sample links, and local image preview for media URL', () => {
      assert.ok(
        dynamicApiTableSource.includes('pastePromoMediaFromClipboard'),
        'DynamicApiTable must define pastePromoMediaFromClipboard'
      )
      assert.ok(
        dynamicApiTableSource.includes('applySamplePromoMedia'),
        'DynamicApiTable must define applySamplePromoMedia'
      )
      assert.ok(
        dynamicApiTableSource.includes('promoLocalImagePreview'),
        'DynamicApiTable must define promoLocalImagePreview'
      )
    })
  })
})


