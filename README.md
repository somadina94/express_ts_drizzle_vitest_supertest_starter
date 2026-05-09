# Express TypeScript Drizzle base

API server using Express 5, TypeScript, Drizzle ORM, and PostgreSQL via the `pg` driver.

## Prerequisites

- **Node.js** 20.19+ (22.x recommended)
- **npm**
- **Docker** (optional, for running PostgreSQL locally)

## Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and set variables:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:

   - **`DATABASE_URL`**: full PostgreSQL connection string, including user and password (for example `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`).
   - **`JWT_SECRET`**: required in **production** (`NODE_ENV=production`). Use a long random string.

4. Apply the checked-in migrations:

   ```bash
   npm run db:migrate
   ```

## Run PostgreSQL with Docker

Example: PostgreSQL 16 on port `5432`, user/password `postgres`/`secret`, default database `postgres`:

```bash
docker run --name express-drizzle-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Use a matching `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:secret@localhost:5432/postgres"
```

Stop/remove when finished:

```bash
docker stop express-drizzle-pg
docker rm express-drizzle-pg
```

## Drizzle: schema and migrations

- Schema: [`src/db/schema.ts`](src/db/schema.ts)
- CLI config: [`drizzle.config.ts`](drizzle.config.ts) (loads `DATABASE_URL` via `dotenv`)
- Migrations: [`drizzle/`](drizzle/)

### First-time setup (after defining models in the schema)

1. Generate a migration from your schema changes:

   ```bash
   npm run db:generate
   ```

2. Apply migrations to your database:

   ```bash
   npm run db:migrate
   ```

The [`package.json`](package.json) `build` script compiles TypeScript directly because Drizzle does not require generated client code.

### After you change the schema

1. Create a new migration:

   ```bash
   npm run db:generate
   ```

2. Apply it:

   ```bash
   npm run db:migrate
   ```

### Prototyping without migrations

To push the schema directly to the database (good for local experiments, not a substitute for migrations in teams/production):

```bash
npm run db:push
```

### Optional: Drizzle Studio

```bash
npm run db:studio
```

### Seeding

Seed script: [`src/db/seed.ts`](src/db/seed.ts). Run it explicitly:

```bash
npm run db:seed
```

## Run the application

**Development** (watch mode):

```bash
npm run dev
```

**Development with Docker Compose** (PostgreSQL + API watch mode):

```bash
npm run dev:docker
```

The API container builds from [`Dockerfile.dev`](Dockerfile.dev) and runs `npm run dev`, so changes under `src/` are synced into the container and restart automatically through `tsx watch`.

To stop the dev Compose stack:

```bash
npm run dev:docker:down
```

To run Drizzle commands against the Compose database:

```bash
docker compose -f docker-compose.dev.yml exec api npm run db:migrate
```

**Production build and start**:

```bash
npm run build
npm start
```

Health check: `GET /api/v1/health`

## Docker image

Build (from repository root):

```bash
docker build -t express-ts-drizzle-base .
```

Run with a database URL:

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:secret@host.docker.internal:5432/postgres" \
  -e JWT_SECRET="your-production-secret" \
  express-ts-drizzle-base
```

Apply migrations to the target database before starting the container (from your machine or CI), for example:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:deploy
```

## Typecheck

```bash
npm run typecheck
```
