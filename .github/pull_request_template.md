## 📋 Pull Request Description

### Summary of Changes
<!-- Provide a clear and concise description of the changes made in this PR. -->

### Related Issue / Ticket
<!-- Link any related issues: Fixes #123, Closes #456 -->
Fixes #

---

## 🔍 Type of Change
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 🎨 UI / Theming / Styling improvement
- [ ] ⚡ Performance optimization
- [ ] 🔒 Security update / Access Level RBAC fix
- [ ] 📝 Documentation update
- [ ] 🧪 Testing / CI/CD automation

---

## 🧪 Pre-Flight Verification Checklist

Please verify the following before submitting:
- [ ] My code adheres to the project's architecture and conventions (MVVM, Clean Architecture).
- [ ] REST HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) are strictly followed for API integrations.
- [ ] Form audit columns (`createdBy`, `modifiedBy`, `createdDate`, etc.) are hidden from UI forms and excluded from `POST`/`PUT` payloads.
- [ ] New routes are registered in [`src/router/index.js`](src/router/index.js) with tab title branding (`<Page> | SwitchFiber Admin`) and registered in Access Level permissions.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm test` passes all unit and integration tests.
- [ ] `npm run build` succeeds cleanly without build warnings or chunk errors.
- [ ] Tested responsive layouts across desktop and mobile viewports in both Light and Dark themes.
