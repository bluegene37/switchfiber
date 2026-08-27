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

// Create tarball of dist/
try {
  execSync(`tar -czf "${tarPath}" -C "${rootDir}" dist`, { stdio: 'inherit' })
  console.log(`✅ Created release archive: ${tarName}`)

  // Generate SHA256 checksum
  const fileBuffer = fs.readFileSync(tarPath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  const hex = hashSum.digest('hex')

  const checksumFile = path.join(releaseOutDir, `${tarName}.sha256`)
  fs.writeFileSync(checksumFile, `${hex}  ${tarName}\n`)
  console.log(`✅ Generated SHA256: ${hex}`)
} catch (err) {
  console.error('❌ Failed to package release archive:', err)
  process.exit(1)
}
