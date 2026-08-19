# Project Rules & Conventions

## REST API Standards
When developing and integrating API calls across the codebase, strictly adhere to standard REST HTTP methods:
- **`GET /api/[Endpoint]`**: Query / list all records.
- **`GET /api/[Endpoint]/{id}`**: Query / retrieve a single record by ID parameter.
- **`POST /api/[Endpoint]`**: Create a new record.
- **`PUT /api/[Endpoint]/{id}`**: Update an existing record by ID.
- **`DELETE /api/[Endpoint]/{id}`**: Delete a record by ID.

## Form Audit Trail Standards (Backend Migration)
For the backend migration, audit columns (`createdBy`, `modifiedBy`, `createdDate`, `modifiedDate`, `lastModified`, `lastModifiedBy`, etc.) are hidden from UI forms, tables, and View modals, and excluded from `POST` (Create) and `PUT` (Update) API payloads so payloads strictly match the new backend schema.

## Menu & Access Level Standards
- **Always include new menu items in the Access Level menu list**: Whenever new routes or menu items are added to the application, ensure they are registered in the sidebar menu list and included in the Access Level permissions configuration so users can access them without being blocked by permission checks.

## Development & Testing Credentials
- **SuperAdmin Test Account**:
  - **Username / Email**: `bluegene37`
  - **Password**: `1234`
  - Use these credentials when authenticating for browser verification, testing protected routes, or debugging permissions.

