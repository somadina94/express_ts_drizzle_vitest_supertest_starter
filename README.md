# Express TypeScript Drizzle base

Production-minded API starter: **Express 5**, **TypeScript**, **Drizzle ORM**, **PostgreSQL** (`pg`). Includes **Zod** env validation, structured logging (**pino** / **pino-http**), split **liveness/readiness** probes, **Vitest** + **Supertest**, **ESLint** / **Prettier**, and **Docker** workflows for dev (bundled Postgres) and prod (API-only compose).

## Prerequisites

- **Node.js** 22.x recommended
- **npm**
- **Docker** (optional; recommended for local Postgres)

## Installation

```bash
npm ci
cp .env.example .env
```

### Environment variables

| Variable       | Purpose                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | **Runtime** Postgres URL (pooler OK in production). Required in **staging/production**.                                                              |
| `DIRECT_URL`   | Optional **direct** URL for **drizzle-kit** (`migrate`, `push`) when `DATABASE_URL` is pooled. Resolved in [`drizzle.config.ts`](drizzle.config.ts). |
| `JWT_SECRET`   | Required in production/staging; minimum **32 characters**.                                                                                           |
| `FRONTEND_URL` | CORS defaults; must not be `localhost` in production/staging.                                                                                        |
| `CORS_ORIGINS` | Optional comma-separated origins (defaults to `FRONTEND_URL`).                                                                                       |
| `LOG_PRETTY`   | Pretty logs for dev; keep `false` in prod images.                                                                                                    |

See [`.env.example`](.env.example) for the full list.

## Database URLs (dev vs prod)

- **Host dev**: `DATABASE_URL` with `localhost` and `POSTGRES_PORT`.
- **Docker Compose dev**: hostname **`postgres`**; override with **`DOCKER_DATABASE_URL`** if credentials change.
- **Production**: real managed Postgres via `.env`; prod Compose is **API-only**.

## Drizzle: schema, migrations

- Schema: [`src/db/schema.ts`](src/db/schema.ts)
- Migrations output: [`drizzle/`](drizzle/)
- Config: [`drizzle.config.ts`](drizzle.config.ts)

```bash
npm run db:generate   # create migration SQL from schema changes
npm run db:migrate    # apply migrations (uses DIRECT_URL || DATABASE_URL)
npm run db:push       # prototype schema without migration files (dev only)
npm run db:studio
npm run db:seed
```

## Run the application

**Development**:

```bash
npm run dev
```

**Docker Compose** (Postgres + API watch):

```bash
npm run docker:dev
npm run docker:dev:down
```

Migrations inside the API container:

```bash
docker compose -f docker-compose.dev.yml exec api npm run db:migrate
```

**Production-style compose** (API only):

```bash
docker compose --env-file .env up --build -d
```

```bash
npm run build
npm start
```

### Health checks

- `GET /api/v1/health/live` — process up.
- `GET /api/v1/health/ready` — DB reachable after startup.

### Quality gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```

## Docker tips

```bash
docker build -t express-ts-drizzle-base .
```

**Host Postgres from containerized API** (Docker Desktop):

```bash
docker build -t express-ts-drizzle-base:test .
npm run docker:run:host-postgres
```

Inside containers, **`localhost` in `DATABASE_URL` is not the host**. Use **`postgres`** (Compose) or **`host.docker.internal`**. See [`src/utils/assertPostgresReachableInDocker.ts`](src/utils/assertPostgresReachableInDocker.ts).

## Deploy script

[`deploy.sh`](deploy.sh) runs `docker compose --env-file .env up --build -d` against [`docker-compose.yml`](docker-compose.yml).

## Troubleshooting

| Symptom                                      | Likely cause          | Fix                                                               |
| -------------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| Boot fails in Compose                        | Wrong `DATABASE_URL`  | Use `@postgres:5432` or set `DOCKER_DATABASE_URL`.                |
| Boot fails in Docker with `localhost` in URL | Loopback in container | Use `postgres` or `host.docker.internal`.                         |
| drizzle-kit fails with pooler                | DDL blocked           | Set `DIRECT_URL` for CLI; keep pooled `DATABASE_URL` for the app. |

## License

MIT — see [`LICENSE`](./LICENSE).
