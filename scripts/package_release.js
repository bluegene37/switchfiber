import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))

const distDir = path.join(rootDir, 'dist')
const releaseOutDir = path.join(rootDir, 'release-assets')

if (!fs.existsSync(distDir)) {
  console.log('📦 Building project first...')
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' })
}

if (!fs.existsSync(releaseOutDir)) {
  fs.mkdirSync(releaseOutDir, { recursive: true })
}

const version = pkg.version || '1.0.0'
const tarName = `switchfiber-web-v${version}.tar.gz`
const tarPath = path.join(releaseOutDir, tarName)

console.log(`📦 Packaging SwitchFiber Web Distribution v${version}...`)

// Helper to write SHA256 checksum file
function writeChecksum(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  const hex = hashSum.digest('hex')
  const checksumFile = path.join(releaseOutDir, `${fileName}.sha256`)
  fs.writeFileSync(checksumFile, `${hex}  ${fileName}\n`)
  console.log(`✅ Generated SHA256: ${hex} (${fileName})`)
}

// 1. Create tarball of dist/
try {
  execSync(`tar -czf "${tarPath}" -C "${rootDir}" dist`, { stdio: 'inherit' })
  console.log(`✅ Created tar release archive: ${tarName}`)
  writeChecksum(tarPath, tarName)
} catch (err) {
  console.error('❌ Failed to package tar release archive:', err)
  process.exit(1)
}

// 2. Create zip archive for Windows Server / IIS deployments
const zipName = `switchfiber-web-v${version}.zip`
const zipPath = path.join(releaseOutDir, zipName)

try {
  // Zip contents inside dist/ directly so extracting unzips files into current folder
  execSync(`cd "${distDir}" && zip -rq "${zipPath}" .`, { stdio: 'inherit' })
  console.log(`✅ Created zip release archive: ${zipName}`)
  writeChecksum(zipPath, zipName)
} catch (err) {
  console.warn('⚠️ Warning: zip utility not available, skipping zip packaging:', err.message)
}
