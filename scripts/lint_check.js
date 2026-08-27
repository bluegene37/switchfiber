import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const DIRS_TO_LINT = ['src', 'scripts', 'tests']
const EXTENSIONS = ['.js', '.vue', '.json']

let errors = 0
let filesChecked = 0

function walkDir(dir) {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        walkDir(fullPath)
      }
    } else {
      const ext = path.extname(file)
      if (EXTENSIONS.includes(ext)) {
        lintFile(fullPath, ext)
      }
    }
  }
}

const DEBUGGER_PATTERN = new RegExp(`\\b${'debug'}${'ger'}\\b`)

function lintFile(filePath, ext) {
  filesChecked++
  const relPath = path.relative(rootDir, filePath)
  const content = fs.readFileSync(filePath, 'utf8')

  // Check 1: Unresolved merge conflicts
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    if (line.startsWith('<<<<<<<') || line.startsWith('>>>>>>>')) {
      console.error(`❌ [Merge Conflict] ${relPath}:${idx + 1}`)
      errors++
    }
  })

  // Check 2: JSON validity
  if (ext === '.json') {
    try {
      JSON.parse(content)
    } catch (err) {
      console.error(`❌ [Invalid JSON] ${relPath}: ${err.message}`)
      errors++
    }
  }

  // Check 3: Accidental debugger statements (excluding this linter file)
  if ((ext === '.js' || ext === '.vue') && !filePath.endsWith('lint_check.js')) {
    if (DEBUGGER_PATTERN.test(content)) {
      console.error(`❌ [Debugger Detected] ${relPath} contains active debugger statement`)
      errors++
    }
  }
}

console.log('🔍 Running SwitchFiber Static Code & Quality Analysis...')
for (const dir of DIRS_TO_LINT) {
  walkDir(path.join(rootDir, dir))
}

// Check root json files
const rootJsonFiles = ['package.json', 'vercel.json', 'openapi.json']
for (const file of rootJsonFiles) {
  const p = path.join(rootDir, file)
  if (fs.existsSync(p)) lintFile(p, '.json')
}

if (errors > 0) {
  console.error(`\n❌ Quality gate failed: ${errors} error(s) found across ${filesChecked} files.`)
  process.exit(1)
} else {
  console.log(`✅ Quality gate passed! Checked ${filesChecked} files with 0 errors.`)
}
