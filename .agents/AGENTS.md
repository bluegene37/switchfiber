# Project Rules & Conventions

## REST API Standards
When developing and integrating API calls across the codebase, strictly adhere to standard REST HTTP methods:
- **`GET /api/[Endpoint]`**: Query / list all records.
- **`GET /api/[Endpoint]/{id}`**: Query / retrieve a single record by ID parameter.
- **`POST /api/[Endpoint]`**: Create a new record.
- **`PUT /api/[Endpoint]/{id}`**: Update an existing record by ID.
- **`DELETE /api/[Endpoint]/{id}`**: Delete a record by ID.

## Form Audit Trail & User ID Standards
- **UI Form Visibility**: Audit columns (`createdBy`, `modifiedBy`, `createdDate`, `modifiedDate`, `lastModified`, `lastModifiedBy`, `timestamp`, `rowVersion`) are hidden from Create and Edit dialogs, and displayed exclusively in the View Details modal under **System Audit & Timestamp Details** (read-only and disabled).
- **Create (`POST`)**: Always populate `createdBy` and `modifiedBy` with the logged-in user ID (`authStore.user.id`).
- **Update (`PUT`)**: Only update `modifiedBy` with the logged-in user ID. Never overwrite `createdBy` or `createdDate` during updates.

## Menu & Access Level Standards
- **Always include new menu items in the Access Level menu list**: Whenever new routes or menu items are added to the application, ensure they are registered in the sidebar menu list and included in the Access Level permissions configuration so users can access them without being blocked by permission checks.

## Document & PDF Storage Standards
- **Always Save Generated Documents to Central Folder**: Whenever generating or saving project documentation, executive reports, architecture guides, or exported PDFs, always save a copy to `Documents/personal_projects/documents/` (full path: `/Users/bluegene37/Documents/personal_projects/documents/`) in addition to any local workspace `docs/` folder.
- **Unique File Naming & Versioning / Timestamp Standard**: Whenever generating, exporting, or saving files (such as documentation, user manuals, reports, audit logs, test runs, or PDF exports), **ALWAYS** include a version number and/or date-time stamp in the filename to guarantee uniqueness and prevent accidental overwrites.
  - **Standard Format**: `[BaseName]_v[Major.Minor]_[YYYYMMDD_HHmm].[ext]` or `[BaseName]_[YYYYMMDD_HHmmss].[ext]` (e.g., `SwitchFiber_User_Manual_v2.0_20260904_1309.pdf`).
  - **Canonical Tooling Alias**: If an unversioned filename (e.g. `SwitchFiber_User_Manual.pdf`) is required for build tooling or direct links, save the canonical file **AND** simultaneously save the unique versioned/timestamped copy in both the local `docs/` and central `Documents/personal_projects/documents/` folders.

## Development & Testing Credentials
- **SuperAdmin Test Account**:
  - **Username / Email**: `bluegene37`
  - **Password**: `1234`
  - Use these credentials when authenticating for browser verification, testing protected routes, or debugging permissions.

## gStack Virtual Engineering Team & Review Personas
The following gStack skills are registered and available to guide project lifecycles:
- **`gstack-office-hours`**: YC Partner discovery to pressure-test ideas and scope.
- **`gstack-ceo-review`**: CEO/Founder strategic alignment, ROI, and simplicity review.
- **`gstack-eng-review`**: Staff Engineer review for architecture, data models, and API rigor.
- **`gstack-design-review`**: Product Designer review to eliminate AI slop and ensure visual polish.
- **`gstack-qa`**: Quality Assurance testing matrix, browser journeys, and form validation.
- **`gstack-review`**: Rigorous code review for performance, security, and REST compliance.
- **`gstack-ship`**: Release engineering pre-flight checks and deployment readiness.
- **`gstack-retro`**: Milestone engineering retrospective and operational takeaways.

