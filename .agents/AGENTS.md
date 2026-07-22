# Project Rules & Conventions

## REST API Standards
When developing and integrating API calls across the codebase, strictly adhere to standard REST HTTP methods:
- **`GET /api/[Endpoint]`**: Query / list all records.
- **`GET /api/[Endpoint]/{id}`**: Query / retrieve a single record by ID parameter.
- **`POST /api/[Endpoint]`**: Create a new record.
- **`PUT /api/[Endpoint]/{id}`**: Update an existing record by ID.
- **`DELETE /api/[Endpoint]/{id}`**: Delete a record by ID.
