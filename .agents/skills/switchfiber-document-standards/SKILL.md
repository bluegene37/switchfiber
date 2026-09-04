---
name: switchfiber-document-standards
description: Standards for document, report, and PDF generation in SwitchFiber. Enforces unique versioning and timestamping in filenames, dual-location storage, and image aspect-ratio integrity.
---

# SwitchFiber Document, Report & PDF Standards

Whenever generating, exporting, or modifying documentation, architecture manuals, audit logs, executive reports, test run summaries, or PDF exports:

---

## 🏷️ 1. Unique File Naming & Versioning Standard

To prevent accidental overwrites and ensure strict audit traceability across deliverables:

1. **Always Include Version and/or Timestamp in the Filename**:
   - **Full Format**: `[BaseName]_v[Major.Minor]_[YYYYMMDD_HHmm].[ext]`
   - **Timestamp Only**: `[BaseName]_[YYYYMMDD_HHmmss].[ext]`
   - *Example*: `SwitchFiber_User_Manual_v2.0_20260904_1309.pdf`
2. **Canonical Tooling Alias**:
   - If build scripts, automated tests, or external links require a static/unversioned path (e.g., `SwitchFiber_User_Manual.pdf`), **always save both**:
     - The canonical unversioned file (`SwitchFiber_User_Manual.pdf`)
     - The unique versioned/timestamped file (`SwitchFiber_User_Manual_v2.0_20260904_1309.pdf`)

---

## 📂 2. Dual-Location Mirrored Storage Standard

Every generated document, user manual, or PDF **must** be stored in both:
1. **Local Workspace**: `./docs/` or workspace root.
2. **Central Archive**: `/Users/bluegene37/Documents/personal_projects/documents/` (mirrored copy).

```javascript
// Node.js Dual Storage Example
const localPath = path.resolve('./docs', uniqueFilename)
const centralPath = path.resolve('/Users/bluegene37/Documents/personal_projects/documents', uniqueFilename)

fs.writeFileSync(localPath, buffer)
fs.writeFileSync(centralPath, buffer)
```

---

## 📐 3. PDF Visual & Image Rendering Standards

1. **Light Mode Standard**: User manuals and operational guides must use high-contrast Light Theme screenshots (`#FFFFFF` background, `#1E293B` text).
2. **No Image Distortion**: Never hardcode both width and height when embedding UI screenshots into PDFs. Always parse intrinsic dimensions and compute render dimensions dynamically:
   ```javascript
   const { width, height } = getPngDimensions(filePath)
   const aspect = width / height
   const renderW = maxContentWidth
   const renderH = renderW / aspect
   ```
3. **Typography & Brand Palette**:
   - Brand Red: `#E74C5A` (`[231, 76, 90]`)
   - Dark Slate: `#1A2530` (`[26, 37, 48]`)
   - Table headers, section banners, running headers, and footers with dynamic page numbering (`Page X of Y`).
