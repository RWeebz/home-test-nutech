# Home Test Nutech

Node.js Express REST API with PostgreSQL database using Docker.

## Setup

1. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   - `APP_JWT_SECRET` - Change to a secure random string (min 32 characters)
   - `APP_S3_ACCESS_KEY_ID`, `APP_S3_SECRET_KEY`, `APP_S3_URL_API`, `APP_S3_BUCKET_NAME` - Your S3 credentials
   - `DOCKER_POSTGRES_DB`, `DOCKER_POSTGRES_USER`, `DOCKER_POSTGRES_PASSWORD` - Database credentials
   - `APP_DATABASE_URL` - Update with your database credentials (format: `postgres://db_user:db_password@postgres:5432/db_name`)

## Docker Usage

**Start application with database:**
```bash
docker compose up -d
```

**Run database migrations inside container:**
```bash
docker compose exec app npm run db:migrate
```

**Seed the database:**
```bash
docker compose exec app npm run db:seed
```

**Access PostgreSQL CLI:**
```bash
docker compose exec postgres psql -U <DOCKER_POSTGRES_USER> -d <DOCKER_POSTGRES_DB>
```

**View application logs:**
```bash
docker compose logs -f app
```

**Open Drizzle Studio (database GUI):**
```bash
docker compose exec app npm run db:studio
```

## Testing

**Run tests in Docker container:**
```bash
docker compose exec app npm test
```

**Run tests with coverage:**
```bash
docker compose exec app npm run test:coverage
```

**Run tests in watch mode:**
```bash
docker compose exec app npm run test:watch
```

## Access

- **API:** http://localhost:3000
- **PostgreSQL:** localhost:5432 (credentials in .env)
