# Project Rules & Conventions

## REST API Standards
When developing and integrating API calls across the codebase, strictly adhere to standard REST HTTP methods:
- **`GET /api/[Endpoint]`**: Query / list all records.
- **`GET /api/[Endpoint]/{id}`**: Query / retrieve a single record by ID parameter.
- **`POST /api/[Endpoint]`**: Create a new record.
- **`PUT /api/[Endpoint]/{id}`**: Update an existing record by ID.
- **`DELETE /api/[Endpoint]/{id}`**: Delete a record by ID.

## Form Audit Trail Standards
When creating or updating records across all forms:
- **CREATE (`POST`)**: Always populate `createdBy` and `modifiedBy` columns with the **numeric ID of the currently logged-in user** (`authStore.user.id`).
- **UPDATE (`PUT`)**: Only update the `modifiedBy` column with the **numeric ID of the currently logged-in user** (`authStore.user.id`). Do NOT overwrite `createdBy` or `createdDate` during updates.
