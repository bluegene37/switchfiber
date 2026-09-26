import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Storage directories matching project standards
const centralDocsDir = '/Users/bluegene37/Documents/personal_projects/documents/switchfiber'
const localDocsDir = path.resolve(rootDir, 'docs')
const localTemplatesDir = path.resolve(rootDir, 'docs/templates')
const localAssetsDir = path.resolve(rootDir, 'docs/assets')
const publicDir = path.resolve(rootDir, 'public')
const publicImagesDir = path.resolve(rootDir, 'public/images')
const centralScreenshotsDir = '/Users/bluegene37/Documents/personal_projects/screenshots/switchfiber'
const localScreenshotsDir = path.resolve(rootDir, 'docs/screenshots')

// Ensure target directories exist
for (const dir of [
  centralDocsDir,
  localDocsDir,
  localTemplatesDir,
  localAssetsDir,
  publicDir,
  publicImagesDir,
  centralScreenshotsDir,
  localScreenshotsDir
]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Read logo.png as base64
const logoPath = path.resolve(publicDir, 'logo.png')
const logoBase64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : ''

// Timestamp formatting: YYYYMMDD_HHmm
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`

const uniquePdfFilename = `SwitchFiber_SOA_Template_v2.0_${timestampStr}.pdf`
const canonicalPdfFilename = `SwitchFiber_SOA_Template.pdf`

console.log('[SOA Generator] Starting generation of Modern SOA Deliverables...')
console.log(`[SOA Generator] Target PDF: ${uniquePdfFilename}`)

// ==========================================
// LOGO-DERIVED STRIPES & FIBER SWOOSH DEFINITIONS
// Inspired by the dynamic curved sphere ribbons in public/logo.png:
// - Aerodynamic white translucent fiber ribbon
// - Deep crimson shadow ribbon (tracking the logo's inner curve)
// - Glowing illuminated core threads
// - Concentric orbital echoes centered on the logo
// ==========================================
const logoStripesSvgDefs = `
    <!-- White Glassy Ribbon Gradient -->
    <linearGradient id="whiteRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.0"/>
      <stop offset="12%" stop-color="#FFFFFF" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.20"/>
      <stop offset="85%" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Deep Crimson Shadow Ribbon Gradient (matches the dark crescent ribbon in logo) -->
    <linearGradient id="crimsonRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3F0408" stop-opacity="0.0"/>
      <stop offset="15%" stop-color="#3F0408" stop-opacity="0.75"/>
      <stop offset="55%" stop-color="#600810" stop-opacity="0.60"/>
      <stop offset="85%" stop-color="#4A050B" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#3F0408" stop-opacity="0.0"/>
    </linearGradient>

    <!-- Secondary Soft White Ribbon -->
    <linearGradient id="softWhiteRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.0"/>
      <stop offset="20%" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="65%" stop-color="#FFFFFF" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0"/>
    </linearGradient>
`

const logoStripesSvgPaths = `
    <!-- 1. Geometric Echo of the Logo Sphere Orbits -->
    <path d="M 105, -35 A 130 130 0 0 1 235, 95 A 130 130 0 0 1 105, 225" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2" stroke-dasharray="6 6"/>
    <path d="M 105, -75 A 170 170 0 0 1 275, 95 A 170 170 0 0 1 105, 265" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5"/>

    <!-- Dynamic Speed Sweep originating from top of Logo sphere -->
    <path d="M 45, 20 C 110, 8 185, 30 220, 80 C 245, 118 240, 160 195, 195" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2.5"/>

    <!-- 2. Deep Crimson Shadow Ribbon (tracking the curve of the logo's inner shadow, sweeping cleanly across lower third) -->
    <path d="M -10, 114 C 220, 142 480, 166 760, 164 C 940, 162 1080, 172 1210, 174 L 1210, 195 L -10, 195 Z" fill="url(#crimsonRibbonGrad)"/>

    <!-- 3. Primary Signature White Glassy Swoosh Ribbon (inspired directly by the white curved stripe of the logo) -->
    <path d="M -10, 86 C 210, 114 470, 142 750, 140 C 930, 138 1070, 150 1210, 154 L 1210, 175 C 1070, 170 930, 158 750, 162 C 470, 166 210, 138 -10, 108 Z" fill="url(#whiteRibbonGrad)"/>

    <!-- 4. Secondary Upper Luminous Fiber Thread (arching over the middle) -->
    <path d="M -10, 58 C 240, 80 520, 106 780, 104 C 960, 102 1100, 118 1210, 126" fill="none" stroke="rgba(255, 255, 255, 0.18)" stroke-width="1.5"/>

    <!-- 5. Dynamic Sharp Fiber Optic Speed Lines (High-contrast illuminated core threads) -->
    <path d="M -10, 97 C 210, 124 470, 152 750, 150 C 930, 148 1070, 160 1210, 164" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="2"/>
    <path d="M -10, 97 C 210, 124 470, 152 750, 150 C 930, 148 1070, 160 1210, 164" fill="none" stroke="#FFFFFF" stroke-width="1"/>

    <!-- Secondary fine accent line -->
    <path d="M 30, 122 C 230, 148 480, 172 760, 170 C 940, 168 1080, 178 1210, 180" fill="none" stroke="rgba(254, 202, 202, 0.35)" stroke-width="1.2"/>
`

// ==========================================
// 1. GENERATE MODERN HEADER HTML & SVG
// ==========================================
const headerHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SwitchFiber Modern SOA Header</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0;
    }
    .header-banner {
      width: 1200px;
      height: 190px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px;
      border-radius: 20px;
      /* Subtle glassy red background with refined depth and specular lighting */
      background:
        radial-gradient(circle at 10% 25%, rgba(255, 255, 255, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 90% 75%, rgba(254, 202, 202, 0.16) 0%, transparent 50%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%),
        linear-gradient(135deg, #DC2626 0%, #B91C1C 48%, #881337 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      box-shadow:
        0 20px 45px -10px rgba(185, 28, 28, 0.45),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.65),
        inset 0 -1.5px 2px rgba(0, 0, 0, 0.25);
    }
    /* Sleek glossy glass sheen across top */
    .header-glare {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 52%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.01) 100%);
      pointer-events: none;
      border-top-left-radius: 19px;
      border-top-right-radius: 19px;
      z-index: 3;
    }

    /* Logo-derived Background Stripes Vector Layer */
    .header-stripes-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    /* Left Branding Section */
    .brand-section {
      display: flex;
      align-items: center;
      gap: 22px;
      position: relative;
      z-index: 2;
    }
    .brand-logo-img {
      width: 114px;
      height: 114px;
      object-fit: contain;
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.28));
      flex-shrink: 0;
    }
    .brand-titles {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .brand-name-row {
      display: flex;
      align-items: baseline;
      gap: 7px;
    }
    .brand-name-switch {
      font-size: 40px;
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.6px;
      line-height: 1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
    }
    .brand-name-fiber {
      font-size: 32px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.95);
      letter-spacing: 0.5px;
      line-height: 1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
    }
    .header-doc-title {
      font-size: 13.5px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
      letter-spacing: 2.2px;
      text-transform: uppercase;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
    }

    /* Right Corporate Info Section */
    .company-section {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      max-width: 560px;
      margin-bottom: 6px;
    }
    .company-name {
      font-size: 17px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
      margin-bottom: 5px;
    }
    .company-address {
      font-size: 13.5px;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.4;
      font-weight: 500;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
  </style>
</head>
<body>
  <div class="header-banner">
    <div class="header-glare"></div>

    <!-- Background Logo-Derived Stripes Vector -->
    <svg class="header-stripes-bg" viewBox="0 0 1200 190" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${logoStripesSvgDefs}
      </defs>
      ${logoStripesSvgPaths}
    </svg>

    <!-- Left Brand (Important texts only, big bold icon without white box) -->
    <div class="brand-section">
      <img src="${logoBase64}" alt="Switch Fiber Logo" class="brand-logo-img">
      <div class="brand-titles">
        <div class="brand-name-row">
          <span class="brand-name-switch">Switch</span>
          <span class="brand-name-fiber">Fiber</span>
        </div>
        <div class="header-doc-title">STATEMENT OF ACCOUNT</div>
      </div>
    </div>

    <!-- Right Corporate Info (Important texts only) -->
    <div class="company-section">
      <div class="company-name">SWITCH INTERNET SERVICES CO.</div>
      <div class="company-address">
        48 Langka St., Sta. Ursula Subdivision, Barangay Batingan, Binangonan, Rizal 1940
      </div>
    </div>
  </div>
</body>
</html>`

// Write Header HTML file
const headerHtmlPath = path.resolve(localTemplatesDir, 'switchfiber_header_modern.html')
fs.writeFileSync(headerHtmlPath, headerHtmlContent, 'utf8')
console.log(`[SOA Generator] Created Modern Header HTML at: ${headerHtmlPath}`)

// Generate Standalone Vector SVG Header
const headerSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 190" width="1200" height="190">
  <defs>
    <radialGradient id="glassRadial1" cx="10%" cy="25%" r="45%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glassRadial2" cx="90%" cy="75%" r="50%">
      <stop offset="0%" stop-color="#FECACA" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#FECACA" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="redGlass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DC2626"/>
      <stop offset="48%" stop-color="#B91C1C"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
    <linearGradient id="glareGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.01"/>
    </linearGradient>
    <filter id="glassDrop" x="-5%" y="-10%" width="110%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#7F1D1D" flood-opacity="0.4"/>
    </filter>
    <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    ${logoStripesSvgDefs}
  </defs>

  <!-- Background Card: Subtle Glassy Red -->
  <rect x="4" y="4" width="1192" height="182" rx="20" fill="url(#redGlass)" stroke="rgba(255, 255, 255, 0.35)" stroke-width="1.5" filter="url(#glassDrop)"/>
  <rect x="4" y="4" width="1192" height="182" rx="20" fill="url(#glassRadial1)"/>
  <rect x="4" y="4" width="1192" height="182" rx="20" fill="url(#glassRadial2)"/>

  <!-- Logo-Derived Dynamic Stripes Background -->
  ${logoStripesSvgPaths}

  <!-- Top Glare Highlight -->
  <rect x="4" y="4" width="1192" height="95" rx="20" fill="url(#glareGrad)"/>

  <!-- Left Big Logo Icon (Floating seamlessly without box) -->
  <image href="${logoBase64}" x="48" y="38" width="114" height="114" preserveAspectRatio="xMidYMid meet" filter="url(#logoGlow)"/>

  <!-- Brand Typography -->
  <text x="182" y="99" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="900" fill="#FFFFFF" letter-spacing="-0.6">Switch <tspan font-size="32" font-weight="700" fill="#FFFFFF" fill-opacity="0.95">Fiber</tspan></text>
  <text x="182" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF" fill-opacity="0.92" letter-spacing="2.2">STATEMENT OF ACCOUNT</text>

  <!-- Right Corporate Details -->
  <g transform="translate(640, 72)">
    <text x="512" y="20" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF" letter-spacing="0.8">SWITCH INTERNET SERVICES CO.</text>
    <text x="512" y="48" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="500" fill="#FFFFFF" fill-opacity="0.92">48 Langka St., Sta. Ursula Subdivision, Barangay Batingan</text>
    <text x="512" y="70" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="500" fill="#FFFFFF" fill-opacity="0.92">Binangonan, Rizal 1940</text>
  </g>
</svg>`

fs.writeFileSync(path.resolve(publicDir, 'soa_header.svg'), headerSvgContent, 'utf8')
fs.writeFileSync(path.resolve(localAssetsDir, 'switchfiber_soa_header.svg'), headerSvgContent, 'utf8')
console.log(`[SOA Generator] Created Modern Header SVG at: ${path.resolve(publicDir, 'soa_header.svg')}`)

// ==========================================
// 2. GENERATE FULL STATEMENT OF ACCOUNT HTML
// ==========================================
const soaHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Statement of Account - Switch Fiber</title>
  <style>
    /* CSS Reset & Page Setup */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1E293B;
      background-color: #F1F5F9;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      padding: 0;
      margin: 0;
      display: flex;
      justify-content: center;
    }

    /* Fixed A4 Sheet Container (100% fits on exactly 1 single page) */
    .soa-page {
      width: 794px;
      height: 1122px;
      max-height: 1122px;
      background: #FFFFFF;
      padding: 22px 28px;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      overflow: hidden;
      page-break-inside: avoid !important;
      page-break-after: avoid !important;
    }

    @media print {
      html, body {
        width: 210mm;
        height: 297mm;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      .soa-page {
        width: 210mm;
        height: 297mm;
        max-height: 297mm;
        margin: 0 !important;
        box-shadow: none;
        padding: 18px 24px !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        box-sizing: border-box;
      }
    }

    /* Top Accent Line */
    .page-accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #DC2626 0%, #EF4444 40%, #FB7185 75%, #F43F5E 100%);
    }

    /* 1. Header Section - Subtle Glassy Red */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 18px;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 10% 25%, rgba(255, 255, 255, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 90% 75%, rgba(254, 202, 202, 0.16) 0%, transparent 50%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 40%, transparent 70%),
        linear-gradient(135deg, #DC2626 0%, #B91C1C 48%, #881337 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.35);
      box-shadow:
        0 8px 20px -4px rgba(185, 28, 28, 0.35),
        inset 0 1px 1px rgba(255, 255, 255, 0.65),
        inset 0 -1px 2px rgba(0, 0, 0, 0.2);
    }

    .header-stripes-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      z-index: 2;
    }

    .brand-logo-img {
      width: 54px;
      height: 54px;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.28));
      flex-shrink: 0;
    }

    .brand-text h1 {
      font-size: 21px;
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1.1;
      display: flex;
      gap: 4px;
      color: #FFFFFF;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .brand-text .text-switch {
      color: #FFFFFF;
    }

    .brand-text .text-fiber {
      color: rgba(255, 255, 255, 0.95);
    }

    .brand-sub {
      font-size: 8.5px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.92);
      letter-spacing: 1.6px;
      text-transform: uppercase;
      margin-top: 1px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .company-info {
      text-align: right;
      max-width: 440px;
      position: relative;
      z-index: 2;
    }

    .company-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 2px;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }

    .company-address {
      font-size: 9.5px;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.35;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    /* 2. Document Title & Highlight Banner */
    .doc-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      margin-bottom: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 6px 14px;
    }

    .doc-title-wrap {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .doc-title {
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: 0.5px;
    }

    .doc-meta-badge {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
    }

    .doc-meta-badge strong {
      color: #0F172A;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #DC2626;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 9999px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .status-pill .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #DC2626;
    }

    /* 3. Subscriber & Amount Due Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }

    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .card-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #F1F5F9;
    }

    .card-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 3.5px;
    }

    .info-row {
      display: grid;
      grid-template-columns: 90px 1fr;
      font-size: 10px;
      align-items: baseline;
    }

    .info-label {
      color: #64748B;
      font-weight: 600;
    }

    .info-value {
      color: #0F172A;
      font-weight: 600;
      word-break: break-word;
    }

    .info-value.bold-highlight {
      font-size: 11.5px;
      font-weight: 800;
      color: #0F172A;
    }

    .info-value.account-pill {
      display: inline-flex;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #DBEAFE;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.5px;
      width: fit-content;
      font-size: 9.5px;
    }

    /* Hero Amount Due Card */
    .amount-hero-card {
      background: linear-gradient(145deg, #FFFFFF 0%, #FFF5F5 100%);
      border: 1.5px solid #FECACA;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .amount-label {
      font-size: 9px;
      font-weight: 800;
      color: #991B1B;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }

    .amount-value {
      font-size: 24px;
      font-weight: 900;
      color: #DC2626;
      line-height: 1.1;
      margin: 2px 0;
    }

    .due-date-row {
      display: flex;
      align-items: center;
      gap: 5px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      padding: 4px 8px;
      border-radius: 5px;
      margin-top: 2px;
    }

    .due-date-row svg {
      width: 13px;
      height: 13px;
      color: #DC2626;
      flex-shrink: 0;
    }

    .due-date-text {
      font-size: 9.5px;
      font-weight: 700;
      color: #991B1B;
    }

    .due-date-text strong {
      color: #DC2626;
      font-weight: 800;
    }

    /* 4. Plan Details Ribbon */
    .plan-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .plan-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .plan-icon-wrap {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: #EFF6FF;
      color: #2563EB;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #DBEAFE;
    }

    .plan-icon-wrap svg {
      width: 15px;
      height: 15px;
    }

    .plan-title {
      font-size: 11px;
      font-weight: 800;
      color: #0F172A;
    }

    .plan-speed {
      font-size: 9.5px;
      font-weight: 600;
      color: #2563EB;
    }

    .plan-period {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      text-align: right;
    }

    .plan-period strong {
      color: #0F172A;
      font-weight: 700;
    }

    /* 5. Statement Charges Table */
    .table-container {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 7px;
    }

    .soa-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    .soa-table thead tr {
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }

    .soa-table th {
      padding: 5px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .soa-table th.text-right {
      text-align: right;
    }

    .soa-table td {
      padding: 4px 10px;
      color: #1E293B;
      border-bottom: 1px solid #F1F5F9;
    }

    .soa-table td.text-right {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .section-header-row td {
      background: #F8FAFC;
      font-weight: 800;
      font-size: 9.5px;
      color: #0F172A;
      padding: 4px 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .total-summary-row td {
      background: #FFF5F5;
      font-weight: 800;
      font-size: 11.5px;
      color: #991B1B;
      padding: 6px 10px;
      border-top: 1.5px solid #FECACA;
      border-bottom: none;
    }

    .total-summary-row td.text-right {
      color: #DC2626;
      font-size: 13px;
    }

    /* 6. Disconnection Notice Banner */
    .notice-banner {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: 6px;
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 7px;
    }

    .notice-banner svg {
      width: 14px;
      height: 14px;
      color: #D97706;
      flex-shrink: 0;
    }

    .notice-text {
      font-size: 9px;
      color: #92400E;
      line-height: 1.35;
      font-weight: 600;
    }

    .notice-text strong {
      color: #B45309;
      font-weight: 800;
    }

    /* 7. How to Pay & Payment Channels */
    .payment-guide-grid {
      display: grid;
      grid-template-columns: 105px 1.6fr 1fr;
      gap: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 8px;
      align-items: center;
    }

    .qr-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 5px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .qr-img {
      width: 68px;
      height: 68px;
    }

    .qr-caption {
      font-size: 8px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }

    .qr-sub {
      font-size: 7.5px;
      color: #64748B;
    }

    .steps-box {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .steps-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }

    .step-item {
      display: flex;
      align-items: baseline;
      gap: 5px;
      font-size: 9px;
      color: #334155;
    }

    .step-num {
      width: 13px;
      height: 13px;
      background: #E2E8F0;
      color: #0F172A;
      border-radius: 50%;
      font-size: 8px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-item strong {
      color: #0F172A;
      font-weight: 700;
    }

    .channels-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-left: 1px solid #E2E8F0;
      padding-left: 10px;
    }

    .channels-title {
      font-size: 9px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .pay-chip {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 700;
      color: #1E293B;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .pay-chip.gcash {
      color: #007DFE;
      border-color: #93C5FD;
      background: #EFF6FF;
    }

    .pay-chip.maya {
      color: #00B14F;
      border-color: #86EFAC;
      background: #F0FDF4;
    }

    .pay-chip.card {
      color: #1E293B;
      background: #F8FAFC;
    }

    /* 8. Perforated Payment Stub */
    .perforated-divider {
      position: relative;
      text-align: center;
      margin: 6px 0 7px 0;
    }

    .perforated-line {
      border-top: 1.5px dashed #94A3B8;
      width: 100%;
    }

    .scissor-badge {
      position: absolute;
      top: -9px;
      left: 30px;
      background: #FFFFFF;
      padding: 0 6px;
      font-size: 9px;
      font-weight: 700;
      color: #64748B;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .scissor-badge svg {
      width: 11px;
      height: 11px;
      transform: rotate(90deg);
    }

    .payment-stub {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
    }

    .stub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
      padding-bottom: 3px;
      border-bottom: 1px solid #E2E8F0;
    }

    .stub-title {
      font-size: 10px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .stub-inst {
      font-size: 8px;
      color: #64748B;
      font-weight: 500;
    }

    .stub-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr 125px;
      gap: 10px;
      align-items: center;
    }

    .stub-meta-col {
      display: flex;
      flex-direction: column;
      gap: 2.5px;
      font-size: 9px;
    }

    .stub-row {
      display: flex;
      justify-content: space-between;
    }

    .stub-label {
      color: #64748B;
      font-weight: 600;
    }

    .stub-val {
      color: #0F172A;
      font-weight: 700;
    }

    .stub-val.amount {
      color: #DC2626;
      font-weight: 800;
      font-size: 11px;
    }

    .barcode-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-left: 1px solid #E2E8F0;
      padding-left: 8px;
    }

    .barcode-svg {
      width: 110px;
      height: 24px;
    }

    .barcode-num {
      font-family: monospace;
      font-size: 8px;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.8px;
      margin-top: 1px;
    }

    /* 9. Legal & Helpdesk Footer */
    .stub-footer {
      margin-top: 5px;
      padding-top: 4px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748B;
    }

    .help-links {
      display: flex;
      gap: 10px;
      font-weight: 600;
    }

    .help-links span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }

    .disclaimer-note {
      font-style: italic;
      color: #94A3B8;
    }
  </style>
</head>
<body>

  <div class="soa-page">
    <div class="page-accent-bar"></div>

    <!-- MAIN BODY CONTENT -->
    <div>
      <!-- 1. HEADER SECTION (Subtle Glassy Red with Logo-Derived Stripes) -->
      <header class="header">
        <!-- Background Logo-Derived Stripes Vector -->
        <svg class="header-stripes-bg" viewBox="0 0 1200 190" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${logoStripesSvgDefs}
          </defs>
          ${logoStripesSvgPaths}
        </svg>

        <div class="brand-box">
          <img src="${logoBase64}" alt="Switch Fiber Logo" class="brand-logo-img">
          <div class="brand-text">
            <h1><span class="text-switch">Switch</span> <span class="text-fiber">Fiber</span></h1>
            <div class="brand-sub">STATEMENT OF ACCOUNT</div>
          </div>
        </div>

        <div class="company-info">
          <div class="company-title">SWITCH INTERNET SERVICES CO.</div>
          <div class="company-address">48 Langka St., Sta. Ursula Subdivision, Barangay Batingan, Binangonan, Rizal 1940</div>
        </div>
      </header>

      <!-- 2. DOCUMENT BANNER & STATUS -->
      <div class="doc-banner">
        <div class="doc-title-wrap">
          <h2 class="doc-title">STATEMENT OF ACCOUNT</h2>
          <span class="doc-meta-badge">SOA NO: <strong>260825145158</strong></span>
          <span class="doc-meta-badge">DATE: <strong>August 23, 2026</strong></span>
        </div>
        <div class="status-pill">
          <span class="dot"></span>
          <span>PAYMENT DUE</span>
        </div>
      </div>

      <!-- 3. SUBSCRIBER & AMOUNT HERO GRID -->
      <div class="meta-grid">
        <!-- Subscriber Information Card -->
        <div class="card">
          <div class="card-header-bar">
            <span class="card-title">Subscriber Information</span>
            <span class="info-value account-pill">ACC: 202305163</span>
          </div>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Account Name:</span>
              <span class="info-value bold-highlight">Yurri F Nesus</span>
            </div>
            <div class="info-row">
              <span class="info-label">Billing Address:</span>
              <span class="info-value">0021 Ynares St Dalig, Batingan, Binangonan, Rizal</span>
            </div>
            <div class="info-row">
              <span class="info-label">Contact No.:</span>
              <span class="info-value">+63 906 692 8894</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email Address:</span>
              <span class="info-value">yurrifnesus@gmail.com</span>
            </div>
          </div>
        </div>

        <!-- Amount Due Hero Card -->
        <div class="amount-hero-card">
          <div>
            <span class="amount-label">Total Amount Due</span>
            <div class="amount-value">₱ 799.00</div>
          </div>
          <div class="due-date-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div class="due-date-text">
              PLEASE PAY ON OR BEFORE: <strong>September 07, 2026</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. SUBSCRIPTION PLAN DETAILS -->
      <div class="plan-card">
        <div class="plan-info">
          <div class="plan-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
          </div>
          <div>
            <div class="plan-title">SwitchConnect - P799</div>
            <div class="plan-speed">Up to 90 Mbps Fiber Broadband</div>
          </div>
        </div>
        <div class="plan-period">
          Billing Cycle Coverage:<br>
          <strong>July 23, 2026 to August 30, 2026</strong>
        </div>
      </div>

      <!-- 5. CHARGES BREAKDOWN TABLE -->
      <div class="table-container">
        <table class="soa-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Period / Details</th>
              <th class="text-right">Amount (PHP)</th>
            </tr>
          </thead>
          <tbody>
            <!-- Previous Charges -->
            <tr class="section-header-row">
              <td colspan="3">1. Previous Charges & Payments</td>
            </tr>
            <tr>
              <td>Balance from Previous Bill</td>
              <td>Previous Billing Statement</td>
              <td class="text-right">₱ 0.00</td>
            </tr>
            <tr>
              <td>Payment Received from Previous Bill</td>
              <td>Official Payment Credit</td>
              <td class="text-right">₱ 0.00</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="font-weight: 700; color: #475569;">Remaining Balance from Previous Bill</td>
              <td></td>
              <td class="text-right" style="font-weight: 700;">₱ 0.00</td>
            </tr>

            <!-- Current Charges -->
            <tr class="section-header-row">
              <td colspan="3">2. Current Charges Breakdown</td>
            </tr>
            <tr>
              <td>Monthly Service Fee (MSF)</td>
              <td>SwitchConnect 90 Mbps Basic Plan</td>
              <td class="text-right">₱ 713.39</td>
            </tr>
            <tr>
              <td>Value Added Tax (12% VAT)</td>
              <td>Government Statutory VAT</td>
              <td class="text-right">₱ 85.61</td>
            </tr>
            <tr>
              <td>Others and Basic Charges</td>
              <td>No Add-on Services</td>
              <td class="text-right">₱ 0.00</td>
            </tr>
            <tr style="background: #FAFAFA;">
              <td style="font-weight: 700; color: #475569;">Total Current Charges</td>
              <td>Due on September 07, 2026</td>
              <td class="text-right" style="font-weight: 700;">₱ 799.00</td>
            </tr>

            <!-- Total Amount Due -->
            <tr class="total-summary-row">
              <td>TOTAL AMOUNT DUE</td>
              <td>Please settle on or before Due Date</td>
              <td class="text-right">₱ 799.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 6. DISCONNECTION ADVISORY BANNER -->
      <div class="notice-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="notice-text">
          <strong>Important Disconnection Advisory:</strong> Please pay the total amount due immediately to avoid disconnection of service. Disconnection may occur on <strong>September 08, 2026</strong>.
        </div>
      </div>

      <!-- 7. HOW TO PAY & CHANNELS -->
      <div class="payment-guide-grid">
        <!-- QR Code -->
        <div class="qr-box">
          <!-- Standalone SVG QR Code for pay.switchfiber.ph -->
          <svg class="qr-img" viewBox="0 0 100 100" fill="#0F172A">
            <!-- Position Marks -->
            <rect x="5" y="5" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="9" y="9" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="13" y="13" width="12" height="12" fill="#DC2626" rx="2"/>

            <rect x="67" y="5" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="71" y="9" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="75" y="13" width="12" height="12" fill="#DC2626" rx="2"/>

            <rect x="5" y="67" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="9" y="71" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="13" y="75" width="12" height="12" fill="#DC2626" rx="2"/>

            <!-- Pattern Blocks -->
            <rect x="38" y="8" width="5" height="5"/>
            <rect x="47" y="8" width="5" height="5"/>
            <rect x="56" y="8" width="5" height="5"/>
            <rect x="38" y="18" width="8" height="5"/>
            <rect x="52" y="18" width="6" height="5"/>

            <rect x="38" y="38" width="6" height="6" fill="#DC2626"/>
            <rect x="48" y="38" width="8" height="6"/>
            <rect x="60" y="38" width="6" height="6"/>
            <rect x="70" y="38" width="8" height="6"/>

            <rect x="8" y="38" width="6" height="6"/>
            <rect x="18" y="38" width="8" height="6"/>
            <rect x="28" y="48" width="6" height="6"/>
            <rect x="8" y="56" width="6" height="6"/>
            <rect x="20" y="56" width="6" height="6"/>

            <rect x="38" y="48" width="8" height="6"/>
            <rect x="50" y="48" width="6" height="6" fill="#DC2626"/>
            <rect x="62" y="48" width="6" height="6"/>
            <rect x="72" y="48" width="6" height="6"/>

            <rect x="38" y="60" width="6" height="8"/>
            <rect x="48" y="60" width="8" height="6"/>
            <rect x="60" y="60" width="6" height="8" fill="#DC2626"/>
            <rect x="72" y="60" width="8" height="6"/>

            <rect x="38" y="74" width="8" height="6"/>
            <rect x="50" y="74" width="6" height="6"/>
            <rect x="62" y="74" width="8" height="6"/>
            <rect x="74" y="74" width="6" height="6"/>

            <rect x="38" y="84" width="6" height="6"/>
            <rect x="48" y="84" width="8" height="6"/>
            <rect x="60" y="84" width="6" height="6"/>
            <rect x="72" y="84" width="8" height="6"/>
          </svg>
          <div class="qr-caption">Scan to Pay Online</div>
          <div class="qr-sub">pay.switchfiber.ph</div>
        </div>

        <!-- Step Instructions -->
        <div class="steps-box">
          <div class="steps-title">How to Pay Online</div>
          <div class="step-item">
            <span class="step-num">1</span>
            <span>Visit <strong>pay.switchfiber.ph</strong> or scan QR code.</span>
          </div>
          <div class="step-item">
            <span class="step-num">2</span>
            <span>Enter Account No. (<strong>202305163</strong>) & Contact No.</span>
          </div>
          <div class="step-item">
            <span class="step-num">3</span>
            <span>Verify your account balance and select payment channel.</span>
          </div>
          <div class="step-item">
            <span class="step-num">4</span>
            <span>Complete transaction & <strong>save the Reference ID</strong>.</span>
          </div>
        </div>

        <!-- Accepted Channels -->
        <div class="channels-box">
          <div class="channels-title">Accepted Methods</div>
          <div class="payment-chips">
            <span class="pay-chip gcash">
              <span>●</span> GCash
            </span>
            <span class="pay-chip maya">
              <span>●</span> Maya
            </span>
            <span class="pay-chip card">Visa</span>
            <span class="pay-chip card">Mastercard</span>
            <span class="pay-chip card">JCB</span>
            <span class="pay-chip card">Amex</span>
            <span class="pay-chip card">BancNet</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM PERFORATED PAYMENT STUB -->
    <div>
      <div class="perforated-divider">
        <div class="perforated-line"></div>
        <div class="scissor-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          <span>TEAR OFF HERE — PAYMENT STUB (REMITTANCE ADVICE)</span>
        </div>
      </div>

      <div class="payment-stub">
        <div class="stub-header">
          <span class="stub-title">Customer Payment Stub</span>
          <span class="stub-inst">Please present this stub when paying through over-the-counter collection partners</span>
        </div>

        <div class="stub-grid">
          <!-- Col 1: Customer Info -->
          <div class="stub-meta-col">
            <div class="stub-row">
              <span class="stub-label">Account Name:</span>
              <span class="stub-val">Yurri F Nesus</span>
            </div>
            <div class="stub-row">
              <span class="stub-label">Account No.:</span>
              <span class="stub-val" style="color: #1D4ED8;">202305163</span>
            </div>
            <div class="stub-row">
              <span class="stub-label">Service Address:</span>
              <span class="stub-val" style="font-size: 9px;">0021 Ynares St Dalig, Binangonan, Rizal</span>
            </div>
          </div>

          <!-- Col 2: Bill Summary -->
          <div class="stub-meta-col">
            <div class="stub-row">
              <span class="stub-label">SOA Number:</span>
              <span class="stub-val">260825145158</span>
            </div>
            <div class="stub-row">
              <span class="stub-label">Due Date:</span>
              <span class="stub-val" style="color: #DC2626;">September 07, 2026</span>
            </div>
            <div class="stub-row">
              <span class="stub-label">Total Amount Due:</span>
              <span class="stub-val amount">₱ 799.00</span>
            </div>
          </div>

          <!-- Col 3: Barcode -->
          <div class="barcode-col">
            <svg class="barcode-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
              <!-- High-resolution Code128 pattern -->
              <rect x="0" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="5" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="9" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="15" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="18" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="25" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="28" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="34" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="37" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="45" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="51" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="55" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="62" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="67" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="71" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="78" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="82" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="88" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="95" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="99" y="0" width="3" height="30" fill="#0F172A"/>
              <rect x="105" y="0" width="1.5" height="30" fill="#0F172A"/>
              <rect x="108" y="0" width="4.5" height="30" fill="#0F172A"/>
              <rect x="115" y="0" width="3" height="30" fill="#0F172A"/>
            </svg>
            <div class="barcode-num">202305163-260825</div>
          </div>
        </div>

        <!-- Footer inside stub -->
        <div class="stub-footer">
          <div class="help-links">
            <span>🌐 fb.com/switchfiberph</span>
            <span>•</span>
            <span>📞 +63-946-038-2517</span>
            <span>•</span>
            <span>✉️ billing@switchfiber.ph</span>
          </div>
          <div class="disclaimer-note">
            Electronic Document • Valid Without Signature • Keep for records
          </div>
        </div>
      </div>
    </div>

  </div>

</body>
</html>`

// Write SOA HTML to local templates and public directory
const localSoaHtmlPath = path.resolve(localTemplatesDir, 'switchfiber_soa_template.html')
const publicSoaHtmlPath = path.resolve(publicDir, 'soa_template.html')

fs.writeFileSync(localSoaHtmlPath, soaHtmlContent, 'utf8')
fs.writeFileSync(publicSoaHtmlPath, soaHtmlContent, 'utf8')
console.log(`[SOA Generator] Created Modern SOA HTML Template at: ${localSoaHtmlPath}`)
console.log(`[SOA Generator] Mirrored SOA HTML to Public at: ${publicSoaHtmlPath}`)

// ==========================================
// 3. GENERATE PUPPETEER ASSETS & PDF
// ==========================================
async function renderAssetsAndPdf() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // ----------------------------------------------------
    // STEP 3A: Render Header and Save as High-Res PNG Image
    // ----------------------------------------------------
    console.log('[Puppeteer] Rendering Header Image...')
    await page.setViewport({ width: 1200, height: 260, deviceScaleFactor: 2 })
    await page.setContent(headerHtmlContent, { waitUntil: 'domcontentloaded' })
    await new Promise((r) => setTimeout(r, 500))

    const headerElement = await page.$('.header-banner')
    if (headerElement) {
      const headerPngBuffer = await headerElement.screenshot({ type: 'png', omitBackground: true })

      // Save Header Image in multiple standard locations
      const headerPublicImg = path.resolve(publicImagesDir, 'switchfiber_soa_header.png')
      const headerPublicRoot = path.resolve(publicDir, 'soa_header.png')
      const headerDocsAsset = path.resolve(localAssetsDir, 'switchfiber_soa_header.png')
      const headerScreenshot = path.resolve(centralScreenshotsDir, 'switchfiber_soa_header.png')
      const localScreenshot = path.resolve(localScreenshotsDir, 'switchfiber_soa_header.png')

      fs.writeFileSync(headerPublicImg, headerPngBuffer)
      fs.writeFileSync(headerPublicRoot, headerPngBuffer)
      fs.writeFileSync(headerDocsAsset, headerPngBuffer)
      fs.writeFileSync(headerScreenshot, headerPngBuffer)
      fs.writeFileSync(localScreenshot, headerPngBuffer)

      console.log(`[Puppeteer] Header PNG saved successfully to:`)
      console.log(`  - ${headerPublicRoot}`)
      console.log(`  - ${headerDocsAsset}`)
      console.log(`  - ${headerScreenshot}`)
    }

    // ----------------------------------------------------
    // STEP 3B: Render Full SOA Template to PDF & Preview
    // ----------------------------------------------------
    console.log('[Puppeteer] Rendering Statement of Account Template to PDF...')
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })
    await page.setContent(soaHtmlContent, { waitUntil: 'domcontentloaded' })
    await new Promise((r) => setTimeout(r, 600))

    const metrics = await page.evaluate(() => {
      const el = document.querySelector('.soa-page')
      return {
        scrollHeight: el ? el.scrollHeight : 0,
        clientHeight: el ? el.clientHeight : 0,
        offsetHeight: el ? el.offsetHeight : 0
      }
    })
    console.log(`[Puppeteer] .soa-page layout metrics:`, metrics)

    // Generate A4 PDF with exact dimensions
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    })

    const pageCount = (pdfBuffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length
    console.log(`[Puppeteer] Total PDF pages count: ${pageCount} (Expected: exactly 1)`)

    // Strict storage locations for PDF
    const centralVersionedPdf = path.resolve(centralDocsDir, uniquePdfFilename)
    const centralCanonicalPdf = path.resolve(centralDocsDir, canonicalPdfFilename)
    const localVersionedPdf = path.resolve(localDocsDir, uniquePdfFilename)
    const localCanonicalPdf = path.resolve(localDocsDir, canonicalPdfFilename)
    const rootCanonicalPdf = path.resolve(rootDir, canonicalPdfFilename)

    fs.writeFileSync(centralVersionedPdf, pdfBuffer)
    fs.writeFileSync(centralCanonicalPdf, pdfBuffer)
    fs.writeFileSync(localVersionedPdf, pdfBuffer)
    fs.writeFileSync(localCanonicalPdf, pdfBuffer)
    fs.writeFileSync(rootCanonicalPdf, pdfBuffer)

    console.log(`[Puppeteer] Generated Modern SOA PDF:`)
    console.log(`  - Central Versioned: ${centralVersionedPdf}`)
    console.log(`  - Central Canonical: ${centralCanonicalPdf}`)
    console.log(`  - Local Versioned:   ${localVersionedPdf}`)
    console.log(`  - Local Canonical:   ${localCanonicalPdf}`)

    // ----------------------------------------------------
    // STEP 3C: Capture Full SOA Page Screenshot
    // ----------------------------------------------------
    console.log('[Puppeteer] Capturing SOA Preview Screenshot...')
    const soaElement = await page.$('.soa-page')
    if (soaElement) {
      const soaPreviewBuffer = await soaElement.screenshot({ type: 'png' })
      const centralPreviewPath = path.resolve(centralScreenshotsDir, 'switchfiber_soa_template_preview.png')
      const localPreviewPath = path.resolve(localScreenshotsDir, 'switchfiber_soa_template_preview.png')

      fs.writeFileSync(centralPreviewPath, soaPreviewBuffer)
      fs.writeFileSync(localPreviewPath, soaPreviewBuffer)
      console.log(`[Puppeteer] SOA Preview Screenshot saved to:`)
      console.log(`  - ${centralPreviewPath}`)
      console.log(`  - ${localPreviewPath}`)
    }

  } finally {
    await browser.close()
    console.log('[Puppeteer] Browser closed. All deliverables generated successfully!')
  }
}

renderAssetsAndPdf().catch((err) => {
  console.error('[SOA Generator] Error generating deliverables:', err)
  process.exit(1)
})
