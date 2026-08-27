# Release Engineering & Deployment Guide

This document defines the release engineering lifecycle, versioning standards, pre-flight verification, automated build packaging, and deployment procedures for the **SwitchFiber Admin Console** web platform.

---

## 📌 Release Principles & Versioning Standards

SwitchFiber adheres strictly to [Semantic Versioning 2.0.0](https://semver.org/):

$$\text{Format: } \mathbf{vMAJOR.MINOR.PATCH}$$

- **`MAJOR`**: Breaking architectural changes, incompatible API protocol adjustments, or major UI framework overhauls.
- **`MINOR`**: New features, new entity views, enhanced dashboards, backward-compatible API additions.
- **`PATCH`**: Bug fixes, security patches, styling adjustments, performance optimizations.

---

## 🔄 Release Pipeline Architecture

```
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │  Feature Branch │ ───►  │  Pull Request   │ ───►  │  Main Branch    │
  │  (feature/*)    │       │  (CI Pass Gate) │       │  (Merged)       │
  └─────────────────┘       └─────────────────┘       └────────┬────────┘
                                                               │
                                                               ▼
  ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  │ GitHub Release  │ ◄───  │ Build Artifacts │ ◄───  │ Git Tag (v*.*.*)│
  │ (Release Notes) │       │ (Tar.gz / Zip)  │       │ (Trigger)       │
  └─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 📋 Release Checklist

### 1. Pre-Flight Quality Verification
Before cutting a release, ensure the local environment passes all quality gates:

```bash
# 1. Install fresh dependencies
npm ci

# 2. Run static code analysis and quality linting
npm run lint

# 3. Execute all automated unit and integration tests
npm test

# 4. Compile production bundle and verify chunk sizes
npm run build

# 5. Preview production build locally
npm run preview
```

### 2. Version Bump & Changelog Update
1. Update `"version"` in [`package.json`](file:///Users/bluegene37/WebstormProjects/switchfiber/package.json):
   ```json
   {
     "version": "1.0.0"
   }
   ```
2. Update [`CHANGELOG.md`](file:///Users/bluegene37/WebstormProjects/switchfiber/CHANGELOG.md) by moving items from `[Unreleased]` into the target release version with the current release date.

3. Commit version updates:
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): bump version to v1.0.0"
   ```

### 3. Git Tagging & GitHub Release Trigger
Tag the release commit using the standard `v` prefix and push to the origin repository:

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: SwitchFiber Admin Web Platform"

# Push tag to remote (Triggers automated GitHub Actions Release Workflow)
git push origin v1.0.0
```

---

## 📦 Automated Release Artifacts

Upon pushing a `v*` tag, `.github/workflows/release.yml` automatically:
1. Validates Node.js matrix requirements.
2. Runs `npm run lint` and `npm test`.
3. Runs `npm run build` to generate the production `dist/` bundle.
4. Packages distribution archives:
   - `switchfiber-web-vX.Y.Z.tar.gz`
   - `switchfiber-web-vX.Y.Z.tar.gz.sha256`
5. Creates a GitHub Release draft/published release with changelog notes and attached release assets.

---

## 🌐 Production Deployment Methods

### Option A: Vercel / Static CDN Hosting
The repository includes pre-configured [`vercel.json`](file:///Users/bluegene37/WebstormProjects/switchfiber/vercel.json) with proxy rewrites, long-term asset caching (`Cache-Control: public, max-age=31536000, immutable`), and security response headers:
```bash
# Deploy to Vercel production
vercel --prod
```

### Option B: Docker Container Deployment
Use the included multi-stage `Dockerfile`:
```bash
# Build Docker image
docker build -t switchfiber-admin:1.0.0 .

# Run container on port 80
docker run -d -p 80:80 --name switchfiber-admin switchfiber-admin:1.0.0
```

### Option C: Standalone Nginx Server
1. Copy contents of `dist/` to `/var/www/switchfiber/html`.
2. Apply the provided `nginx.conf` template ensuring client-side fallback `try_files $uri $uri/ /index.html;`.
3. Reload Nginx: `sudo systemctl reload nginx`.

---

## 🚨 Rollback Procedures

If critical defects are identified post-deployment:
1. **Vercel**: Roll back instantly to previous successful deployment via Vercel Dashboard or CLI: `vercel rollback`.
2. **Docker**: Redeploy previous tagged container image (e.g. `switchfiber-admin:0.9.9`).
3. **Git**: Revert release commit on `main` and publish hotfix release `vX.Y.Z+1`.
