# Docker Setup Guide

This guide explains how to run the Acquisitions application using Docker with Neon Database in both development and production environments.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose) installed
- Basic understanding of Docker and Docker Compose
- Access to Neon Cloud account (for production)

## Development Environment with Neon Local

Neon Local provides a local PostgreSQL database that mimics Neon Cloud features, including ephemeral branches for development and testing.

### Quick Start

1. **Create environment file:**
   ```bash
   cp .env.development.example .env.development
   ```

2. **Start the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

   Or run in detached mode:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Health check: http://localhost:3000/health
   - Neon Local Control API: http://localhost:8080

### How It Works

- **Neon Local Service**: Runs a local PostgreSQL instance that behaves like Neon Cloud
  - Automatically creates ephemeral branches for development
  - Accessible at `postgres://user:password@neon-local:5432/dbname`
  - Data persists in Docker volume `neon-local-data`

- **Application Service**: Your Node.js application running in development mode
  - Hot reload enabled (code changes reflect immediately)
  - Connects to Neon Local via the service name `neon-local`
  - Uses `DATABASE_URL` from environment variables

### Database Migrations (Development)

To run database migrations in the development container:

```bash
# Enter the application container
docker-compose -f docker-compose.dev.yml exec app sh

# Run migrations
npm run db:migrate
```

### Stopping Development Environment

```bash
# Stop containers (keeps volumes)
docker-compose -f docker-compose.dev.yml down

# Stop containers and remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v
```

## Production Environment with Neon Cloud

Production uses the actual Neon Cloud Database (serverless PostgreSQL). No local database proxy is needed.

### Setup

1. **Get your Neon Cloud Database URL:**
   - Go to https://console.neon.tech
   - Create a new project or select an existing one
   - Copy the connection string from the dashboard
   - Format: `postgres://username:password@endpoint.neon.tech/neondb?sslmode=require`

2. **Create production environment file:**
   ```bash
   cp .env.production.example .env.production
   ```

3. **Edit `.env.production` with your actual values:**
   ```env
   DATABASE_URL=postgres://your-actual-neon-url...
   JWT_SECRET=your-strong-random-secret
   ARCJET_KEY=your-production-arcjet-key
   ```

   **⚠️ Security Note:** Never commit `.env.production` to version control!

4. **Build and start production containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Production Deployment Options

#### Option 1: Docker Compose (Simple Deployment)

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

#### Option 2: Environment Variables (Recommended for Cloud Platforms)

Instead of using `.env.production`, set environment variables directly:

```bash
export DATABASE_URL="postgres://..."
export JWT_SECRET="..."
export ARCJET_KEY="..."

docker-compose -f docker-compose.prod.yml up -d
```

#### Option 3: Docker Swarm / Kubernetes

For orchestrated deployments, use the production Dockerfile and set environment variables via your orchestration platform's secrets management.

### Database Migrations (Production)

**⚠️ Important:** Run migrations carefully in production!

```bash
# Option 1: Run migrations from your local machine (ensure DATABASE_URL points to production)
npm run db:migrate

# Option 2: Run migrations inside the production container
docker-compose -f docker-compose.prod.yml exec app sh
npm run db:migrate
```

## Environment Variable Switching

The application automatically switches between development and production based on:

1. **`docker-compose.dev.yml`**: Sets `DATABASE_URL=postgres://user:password@neon-local:5432/dbname`
2. **`docker-compose.prod.yml`**: Uses `DATABASE_URL` from `.env.production` or environment variables

The `DATABASE_URL` environment variable is the single source of truth for database connections.

### Verification

To verify which database you're connected to:

```bash
# Development: Check container logs
docker-compose -f docker-compose.dev.yml logs app | grep DATABASE_URL

# Production: Check container environment
docker-compose -f docker-compose.prod.yml exec app env | grep DATABASE_URL
```

## Troubleshooting

### Development Issues

**Problem:** Cannot connect to Neon Local
```bash
# Check if Neon Local is running and healthy
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs neon-local
```

**Problem:** Application won't start
```bash
# Check application logs
docker-compose -f docker-compose.dev.yml logs app

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

**Problem:** Database connection errors
- Ensure `DATABASE_URL` in `.env.development` matches the Neon Local service name
- Verify Neon Local container is healthy: `docker-compose -f docker-compose.dev.yml ps`

### Production Issues

**Problem:** Missing DATABASE_URL
- Ensure `.env.production` exists and contains valid `DATABASE_URL`
- Or set `DATABASE_URL` as an environment variable before running compose

**Problem:** SSL connection errors
- Neon Cloud requires SSL. Ensure your connection string includes `?sslmode=require`
- Verify your Neon Cloud database is accessible from your deployment location

**Problem:** Container keeps restarting
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs app

# Check container health
docker-compose -f docker-compose.prod.yml ps
```

## Best Practices

### Development
- Use Neon Local for fast iteration and testing
- Create feature branches that correspond to Neon Local ephemeral branches
- Reset local database when needed: `docker-compose -f docker-compose.dev.yml down -v`

### Production
- Always use environment variables or secrets management (never hardcode)
- Use strong, randomly generated `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- Enable SSL for all database connections
- Monitor database connections and connection pooling
- Set up automated backups via Neon Cloud dashboard
- Use health checks and monitoring

### Security
- Never commit `.env.production` or `.env.development` with real secrets
- Rotate secrets regularly
- Use Docker secrets or your platform's secret management in production
- Regularly update Docker images and dependencies

## Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Cloud Console](https://console.neon.tech)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

