# Metric Tracking System

A NestJS-based service for tracking metrics with support for multiple units and unit types:
- Distance: meter, centimeter, inch, feet, yard
- Temperature: celsius (°C), fahrenheit (°F), kelvin (°K)

This project uses:
- NestJS
- PostgreSQL
- TypeORM (with snake_naming_strategy)
- UUID primary keys
- Docker Compose for local DB provisioning
- Global response interceptor and exception filter for consistent API responses

---

## Table of Contents

1. Prerequisites
2. Project Structure
3. Configuration
4. Database Setup and Seeding
5. Running the App
6. API Usage
7. Implementation Notes
8. Development Tips
9. Troubleshooting
10. License

---

## 1) Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- A terminal with access to your environment variables

---

## 2) Project Structure

Relevant directories and files:
- src/
  - app.module.ts
  - main.ts
  - controllers/unit.controller.ts
  - services/unit.service.ts
  - entities/
    - unit.entity.ts
    - unit_attribute.entity.ts
    - unit_val.entity.ts
    - abstract.entity.ts
  - infrastructures/
    - database/database.module.ts
    - http/response.interceptor.ts
    - http/http-exception.filter.ts
- seeding/init.sql
- docker-compose.yml
- .env
- package.json

---

## 3) Configuration

Create a `.env` file in the project root with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=metric_user
DB_PASSWORD=metric_password
DB_NAME=metric_db
PORT=3000
```

Notes:
- `docker-compose.yml` reads DB_* and mounts `seeding/init.sql` so the database is initialized and seeded on first run.
- The app reads `PORT` for the HTTP server port.

---

## 4) Database Setup and Seeding

This project expects a PostgreSQL database. The Docker Compose service will:
- Start Postgres
- Create the database
- Run `seeding/init.sql` once (only the first time a new data volume is created)

Tables:
- `tb_unit` — unit types (Distance, Temperature) with UUID PK and timestamps
- `tb_unit_attribute` — unit attributes (meter, celsius, etc.) with UUID PK and FK `unit_id`
- `tb_unit_val` — sample values per attribute as numeric strings (e.g., "342.43")

Seeding includes:
- Units: Distance, Temperature
- Attributes:
  - Distance: meter (base), centimeter, inch, feet, yard
  - Temperature: celsius (base), fahrenheit, kelvin
- Sample values (strings):
  - Distance: "12.50" (meter), "342.43" (centimeter), "25.00" (inch), "3.00" (feet), "1.25" (yard)
  - Temperature: "43" (celsius), "86" (fahrenheit), "316.15" (kelvin)

Important:
- Postgres only runs `init.sql` during first-time initialization of the data directory.
- To re-run the seed, you must remove the volume.

Reset the DB to re-seed:
```
docker compose down -v
docker compose up -d
```

---

## 5) Running the App

Install dependencies:
```
pnpm install
```

Start Postgres via Docker Compose:
```
docker compose up -d
```

Run the app (development):
```
pnpm run start:dev
```

Run the app (production build):
```
pnpm run build
pnpm run start:prod
```

The server will start on `http://localhost:3000` unless you change `PORT` in `.env`.

---

## 6) API Usage

Global response and error format:
- Success response envelope:
  ```
  {
    "success": true,
    "data": ...,
    "message": "optional",
    "path": "/requested/path",
    "timestamp": "ISO date string",
    "meta": { "optional": "metadata" }
  }
  ```
- Error response envelope:
  ```
  {
    "success": false,
    "statusCode": 400,
    "message": "description",
    "error": "Bad Request",
    "path": "/requested/path",
    "timestamp": "ISO date string",
    "errors": ["validation messages or details"],
    "meta": { "optional": "metadata" }
  }
  ```

Endpoints:
- GET `/units/`
  - Query parameters (optional):
    - `type`: "Distance" or "Temperature"
    - `unit`: e.g., "meter", "celsius"
    - `period`: integer months to filter by recent created_at, e.g., `period=6`
  - Behavior:
    - No filters → lists all units with attributes and values
    - With `type` and optionally `unit`/`period` → filters accordingly
    - Validates that the provided `unit` belongs to the `type`

Examples:

1) List all units
```
GET http://localhost:3000/units/
```

2) Filter by type (Distance)
```
GET http://localhost:3000/units/?type=Distance
```

3) Filter by type and unit (Temperature + celsius)
```
GET http://localhost:3000/units/?type=Temperature&unit=celsius
```

4) Filter by type, unit, and last N months
```
GET http://localhost:3000/units/?type=Distance&unit=meter&period=3
```

---

## 7) Implementation Notes

Entities:
- UUID primary keys using TypeORM’s `@PrimaryGeneratedColumn('uuid')`
- `UnitEntity` and `UnitValEntity` extend `AbstractEntity` to include `createdAt`, `updatedAt`, `deletedAt`
- Relations:
  - `UnitEntity` 1..N `UnitAttributeEntity`
  - `UnitAttributeEntity` N..1 `UnitEntity`
  - `UnitAttributeEntity` 1..N `UnitValEntity`
  - `UnitValEntity` N..1 `UnitAttributeEntity` (property `attribute`)
- Naming strategy: snake case (managed in database module)

Database Module:
- Uses `TypeOrmModule.forRootAsync(...)` with:
  - Postgres connection from environment variables
  - Snake naming strategy
  - Synchronize off (SQL schema managed by `seeding/init.sql`)

Repositories in Module Scope:
- Import `TypeOrmModule.forFeature([UnitEntity, UnitAttributeEntity, UnitValEntity])` in the module that declares `UnitService` to ensure repositories are injectable.

Global HTTP Layer:
- ResponseInterceptor for success envelope
- HttpExceptionFilter for error envelope
- ValidationPipe enabled globally with transformation

Service Methods (JSDoc added):
- `validationBiz(payload)` — validates type existence, unit existence, and membership
- `findByConditions(payload)` — filters data and transforms values via conversion utilities
- `listAll()` — lists all units with attributes and values
- `units(payload)` — entry point that chooses between `listAll` and `findByConditions` with business validation

---

## 8) Development Tips

- Ensure your `.env` matches `docker-compose.yml` values so the app can connect to the DB.
- Keep `synchronize: false` and manage your schema with SQL scripts or migrations to prevent drift.
- If you refactor relations or entity names, update the seed accordingly to keep alignment.
- The seed script uses UUID default generation and sets FK constraints and helpful indexes.

---

## 9) Troubleshooting

- “No metadata for UnitEntity was found.”:
  - Ensure the TypeORM connection includes your entity classes.
  - Ensure the module that declares the service imports `TypeOrmModule.forFeature([...])`.
  - Avoid mixed import paths that could duplicate entity classes.

- Seed didn’t run:
  - Postgres only runs `init.sql` on first initialization of the data directory.
  - Reset the volume:
    ```
    docker compose down -v
    docker compose up -d
    ```

- Repository DI errors (UnknownDependenciesException):
  - Make sure you’ve imported `TypeOrmModule.forFeature([...])` in the module where the service is provided or export it from a global database module.

---

## 10) License

MIT