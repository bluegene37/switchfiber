# Contributing to SwitchFiber

Thank you for your interest in contributing to **SwitchFiber**! We welcome bug reports, feature enhancements, documentation improvements, and architectural optimizations.

---

## 🛠️ Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**: Modern Git CLI

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/switchfiber/switchfiber.git
cd switchfiber

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start local development server (with Vite hot-reload & API proxy)
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🌿 Branching & Git Workflow

We use a standard GitHub Flow branching model:

1. **`main`**: Production-ready, deployable branch. Directly protected against unreviewed pushes.
2. **`feature/<feature-name>`**: For new features, views, and UI components.
3. **`fix/<bug-name>`**: For bug fixes and regression resolutions.
4. **`refactor/<scope>`**: For code cleanup and architectural refactoring.
5. **`docs/<topic>`**: For documentation updates.

---

## 📝 Commit Standards

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

$$\text{Format: } \mathbf{<type>(<scope>): <description>}$$

### Types
- **`feat`**: A new user-facing feature or view
- **`fix`**: A bug fix
- **`docs`**: Documentation only changes
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **`refactor`**: Code changes that neither fix a bug nor add a feature
- **`perf`**: Code changes that improve performance
- **`test`**: Adding missing tests or correcting existing tests
- **`chore`**: Maintenance tasks, dependency updates, CI/CD configuration

### Examples
```text
feat(applications): add batch status approval modal
fix(router): update browser tab title branding to SwitchFiber Admin
refactor(table): optimize column auto-detection in DynamicApiTable
test(permissions): add unit tests for RBAC menu authorization
```

---

## 🏛️ Code Architecture & Guidelines

### 1. REST API Conventions
All API integrations must adhere to standard REST HTTP methods:
- `GET /api/[Endpoint]`: List all records
- `GET /api/[Endpoint]/{id}`: Retrieve a single record
- `POST /api/[Endpoint]`: Create a new record
- `PUT /api/[Endpoint]/{id}`: Update an existing record
- `DELETE /api/[Endpoint]/{id}`: Delete a record

### 2. Form Audit Trail Standards
Backend audit fields (`createdBy`, `modifiedBy`, `createdDate`, `modifiedDate`, `lastModified`, `lastModifiedBy`) must be hidden from user-facing forms/modals and excluded from `POST` and `PUT` request payloads.

### 3. Access Level Permissions
Whenever creating a new route or screen:
- Add the route to [`src/router/index.js`](file:///Users/bluegene37/WebstormProjects/switchfiber/src/router/index.js) with its tab title label.
- Register the menu item in the Access Level permissions configuration so users can access it based on their assigned role.

---

## 🧪 Pre-Submission Checklist

Before submitting a Pull Request, ensure that:
1. `npm run lint` passes with 0 errors.
2. `npm test` passes 100% of unit and integration tests.
3. `npm run build` compiles without bundle or asset errors.
4. Code is properly documented and follows existing component styling conventions.
