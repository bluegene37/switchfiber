# Security Policy & Vulnerability Disclosure

SwitchFiber takes the security and integrity of telecommunications and ISP operations infrastructure seriously. We appreciate the responsible disclosure of any vulnerabilities found in the **SwitchFiber Admin Console**.

---

## 🛡️ Supported Versions

Only the latest active minor release receives active security patches and updates:

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `1.0.x` | ✅ | Active Production Release |
| `< 1.0.0` | ❌ | Development Pre-releases (EOL) |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within SwitchFiber, please follow these responsible disclosure steps:

1. **Do not create a public GitHub issue** for undisclosed security vulnerabilities.
2. Email your findings directly to the security team at **`security@switchfiber.ph`** (or create a private GitHub Security Advisory).
3. Include the following details in your report:
   - Type of vulnerability (e.g. XSS, Session fixation, RBAC bypass, CSRF)
   - Step-by-step instructions to reproduce the issue
   - Proof of concept (PoC) code or screenshots
   - Potential impact on operations or subscriber data
   - Any suggested mitigations

### Response Timeline
- **Initial Acknowledgment**: Within 24 hours
- **Severity Assessment & Triaging**: Within 48 hours
- **Patch Release & Security Advisory**: Within 7 business days for critical vulnerabilities

---

## 🔒 Security Best Practices for Deployments

### 1. Environment & API Secrets
- Never commit `.env` files or API secrets to the repository.
- Use `VITE_API_URL` exclusively for backend origin proxying. Remember that client-side `VITE_*` environment variables are inlined into JavaScript bundles during build time and are publicly readable by clients.

### 2. Authentication & Session Hygiene
- Authentication tokens (Bearer JWTs) are stored in secure browser storage and attached automatically via Axios request interceptors.
- On `401 Unauthorized` API responses, client sessions are instantly purged (`localStorage` and `sessionStorage`) and the user is redirected to the login portal.

### 3. Transport Security & HTTP Headers
- Always enforce **HTTPS/TLS 1.3** in production environments.
- Deployments should enforce security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
