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

## Development & Testing Credentials
- **SuperAdmin Test Account**:
  - **Username / Email**: `bluegene37`
  - **Password**: `1234`
  - Use these credentials when authenticating for browser verification, testing protected routes, or debugging permissions.

